const fs = require('fs');
const path = require('path');

// Get archive service (lazy import to avoid circular deps)
let pollArchiveService = null;
const getPollArchiveService = () => {
    if (!pollArchiveService) {
        pollArchiveService = require('./pollArchiveService');
    }
    return pollArchiveService;
};

class PollService {
    constructor() {
        this.polls = new Map();
        this.pollId = 1;
        this.dataDir = path.join(__dirname, '../data');
        this.ensureDataDir();
        this.loadPolls();
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    createPoll(title, description, options, duration = 86400) {
        const poll = {
            id: this.pollId++,
            title,
            description,
            options: options.map((opt, idx) => ({
                id: idx,
                text: opt,
                votes: 0,
                voters: []
            })),
            createdAt: Date.now(),
            endsAt: Date.now() + duration * 1000,
            active: true,
            totalVotes: 0,
            voters: new Set(), // Speichert User-IDs, nicht Wallets
            userVotes: new Map() // userId -> optionId mapping
        };

        this.polls.set(poll.id, poll);
        this.savePolls();
        return poll;
    }

    vote(pollId, userId, optionId) {
        const poll = this.polls.get(pollId);
        if (!poll) {
            throw new Error('Poll nicht gefunden');
        }

        if (!poll.active || Date.now() > poll.endsAt) {
            throw new Error('Abstimmung ist beendet');
        }

        // Prüfe nach User-ID, nicht nach Wallet
        if (poll.voters.has(userId.toString())) {
            throw new Error('Du hast bereits abgestimmt');
        }

        const option = poll.options[optionId];
        if (!option) {
            throw new Error('Option nicht gültig');
        }

        option.votes++;
        option.voters.push(userId);
        poll.voters.add(userId.toString());
        poll.userVotes.set(userId.toString(), optionId);
        poll.totalVotes++;

        this.savePolls();
        return poll;
    }

    getPoll(pollId) {
        const poll = this.polls.get(pollId);
        if (!poll) return null;

        return {
            ...poll,
            voters: Array.from(poll.voters),
            active: poll.active && Date.now() <= poll.endsAt,
            timeRemaining: Math.max(0, poll.endsAt - Date.now())
        };
    }

    getAllPolls() {
        return Array.from(this.polls.values()).map(poll => ({
            ...poll,
            voters: Array.from(poll.voters),
            active: poll.active && Date.now() <= poll.endsAt,
            timeRemaining: Math.max(0, poll.endsAt - Date.now())
        }));
    }

    getActivePolls() {
        // Returns only active and non-expired polls
        return Array.from(this.polls.values())
            .filter(poll => poll.active && Date.now() <= poll.endsAt)
            .map(poll => ({
                ...poll,
                voters: Array.from(poll.voters),
                active: true,
                timeRemaining: Math.max(0, poll.endsAt - Date.now())
            }));
    }

    closeExpiredPolls() {
        const archiveService = getPollArchiveService();
        
        for (const [id, poll] of this.polls) {
            if (poll.active && Date.now() > poll.endsAt) {
                poll.active = false;
                
                // Archive the poll
                try {
                    archiveService.archivePoll({
                        id: poll.id,
                        title: poll.title,
                        description: poll.description,
                        options: poll.options,
                        createdAt: poll.createdAt,
                        endsAt: poll.endsAt,
                        totalVotes: poll.totalVotes
                    });
                } catch (error) {
                    console.error(`⚠️ Failed to archive poll ${poll.id}:`, error.message);
                }
            }
        }
        this.savePolls();
    }

    closePoll(pollId) {
        const poll = this.polls.get(pollId);
        if (!poll) {
            throw new Error('Abstimmung nicht gefunden');
        }
        poll.active = false;
        this.savePolls();
        return poll;
    }

    savePolls() {
        const data = Array.from(this.polls.entries()).map(([id, poll]) => ({
            id,
            title: poll.title,
            description: poll.description,
            options: poll.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes,
                voters: opt.voters
            })),
            createdAt: poll.createdAt,
            endsAt: poll.endsAt,
            active: poll.active,
            totalVotes: poll.totalVotes,
            voters: Array.from(poll.voters)
        }));

        fs.writeFileSync(
            path.join(this.dataDir, 'polls.json'),
            JSON.stringify(data, null, 2)
        );
    }

    loadPolls() {
        const pollsFile = path.join(this.dataDir, 'polls.json');
        if (fs.existsSync(pollsFile)) {
            const data = JSON.parse(fs.readFileSync(pollsFile, 'utf8'));
            data.forEach(pollData => {
                const poll = {
                    ...pollData,
                    voters: new Set(pollData.voters),
                    options: pollData.options.map(opt => ({
                        ...opt,
                        voters: opt.voters || []
                    }))
                };
                this.polls.set(poll.id, poll);
                this.pollId = Math.max(this.pollId, poll.id + 1);
            });
        }
    }
}

module.exports = new PollService();
