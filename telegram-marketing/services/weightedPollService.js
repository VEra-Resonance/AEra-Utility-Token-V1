const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');

// Get archive service (lazy import to avoid circular deps)
let pollArchiveService = null;
const getPollArchiveService = () => {
    if (!pollArchiveService) {
        pollArchiveService = require('./pollArchiveService');
    }
    return pollArchiveService;
};

class WeightedPollService {
    constructor(web3Instance, tokenAddress, tokenAbi) {
        this.web3 = web3Instance;
        this.tokenAddress = tokenAddress;
        this.tokenAbi = tokenAbi;
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

    async getUserTokenBalance(walletAddress) {
        try {
            const contract = new this.web3.eth.Contract(this.tokenAbi, this.tokenAddress);
            const balance = await contract.methods.balanceOf(walletAddress).call();
            return BigInt(balance) / BigInt(10 ** 18); // Convert to whole tokens
        } catch (error) {
            console.error(`❌ Balance check failed for ${walletAddress}:`, error.message);
            return 0n;
        }
    }

    createWeightedPoll(title, description, options, minTokensRequired = 0, duration = 86400) {
        const poll = {
            id: this.pollId++,
            title,
            description,
            options: options.map((opt, idx) => ({
                id: idx,
                text: opt,
                weightedVotes: 0n, // BigInt for precision
                voters: new Map(), // walletAddress -> weight
                voteCount: 0
            })),
            createdAt: Date.now(),
            endsAt: Date.now() + duration * 1000,
            active: true,
            totalWeightedVotes: 0n,
            voters: new Map(), // walletAddress -> weight
            minTokensRequired,
            votingType: 'weighted'
        };

        this.polls.set(poll.id, poll);
        this.savePolls();
        return poll;
    }

    async weightedVote(pollId, walletAddress, optionId) {
        const poll = this.polls.get(pollId);
        if (!poll) {
            throw new Error('Abstimmung nicht gefunden');
        }

        if (!poll.active || Date.now() > poll.endsAt) {
            throw new Error('Abstimmung ist beendet');
        }

        // Check if already voted
        if (poll.voters.has(walletAddress)) {
            throw new Error('Du hast bereits abgestimmt');
        }

        // Get token balance
        const weight = await this.getUserTokenBalance(walletAddress);

        if (weight < BigInt(poll.minTokensRequired)) {
            throw new Error(
                `Mindestens ${poll.minTokensRequired} AERA erforderlich. Du hast: ${weight}`
            );
        }

        const option = poll.options[optionId];
        if (!option) {
            throw new Error('Option nicht gültig');
        }

        // Record vote with weight
        option.weightedVotes += weight;
        option.voters.set(walletAddress, weight);
        option.voteCount++;
        poll.voters.set(walletAddress, weight);
        poll.totalWeightedVotes += weight;

        this.savePolls();
        
        return {
            poll,
            weight: weight.toString(),
            option: option.text
        };
    }

    getWeightedPoll(pollId) {
        const poll = this.polls.get(pollId);
        if (!poll) return null;

        return {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            createdAt: poll.createdAt,
            endsAt: poll.endsAt,
            active: poll.active && Date.now() <= poll.endsAt,
            timeRemaining: Math.max(0, poll.endsAt - Date.now()),
            minTokensRequired: poll.minTokensRequired,
            totalWeightedVotes: poll.totalWeightedVotes.toString(),
            voteCount: poll.voters.size,
            options: poll.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                weightedVotes: opt.weightedVotes.toString(),
                percentage: poll.totalWeightedVotes > 0n 
                    ? ((opt.weightedVotes * 100n) / poll.totalWeightedVotes).toString()
                    : '0',
                voteCount: opt.voteCount
            }))
        };
    }

    getAllWeightedPolls() {
        return Array.from(this.polls.values()).map(poll => this.getWeightedPoll(poll.id));
    }

    getActiveWeightedPolls() {
        // Returns only active and non-expired polls
        return Array.from(this.polls.values())
            .filter(poll => poll.active && Date.now() <= poll.endsAt)
            .map(poll => this.getWeightedPoll(poll.id));
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
                        totalWeightedVotes: poll.totalWeightedVotes.toString()
                    });
                } catch (error) {
                    console.error(`⚠️ Failed to archive weighted poll ${poll.id}:`, error.message);
                }
            }
        }
        this.savePolls();
    }

    getPollResults(pollId) {
        const poll = this.polls.get(pollId);
        if (!poll) return null;

        const sortedOptions = [...poll.options].sort(
            (a, b) => Number(b.weightedVotes - a.weightedVotes)
        );

        return {
            id: poll.id,
            title: poll.title,
            winner: sortedOptions[0],
            results: sortedOptions.map((opt, rank) => ({
                rank: rank + 1,
                option: opt.text,
                weightedVotes: opt.weightedVotes.toString(),
                percentage: poll.totalWeightedVotes > 0n
                    ? ((opt.weightedVotes * 100n) / poll.totalWeightedVotes).toString()
                    : '0',
                voteCount: opt.voteCount
            })),
            totalWeightedVotes: poll.totalWeightedVotes.toString(),
            totalVoters: poll.voters.size,
            status: poll.active ? 'Aktiv' : 'Beendet'
        };
    }

    savePolls() {
        const data = Array.from(this.polls.entries()).map(([id, poll]) => ({
            id,
            title: poll.title,
            description: poll.description,
            options: poll.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                weightedVotes: opt.weightedVotes.toString(),
                voters: Array.from(opt.voters.entries()).map(([addr, weight]) => ({
                    address: addr,
                    weight: weight.toString()
                })),
                voteCount: opt.voteCount
            })),
            createdAt: poll.createdAt,
            endsAt: poll.endsAt,
            active: poll.active,
            minTokensRequired: poll.minTokensRequired,
            totalWeightedVotes: poll.totalWeightedVotes.toString(),
            voters: Array.from(poll.voters.entries()).map(([addr, weight]) => ({
                address: addr,
                weight: weight.toString()
            })),
            votingType: poll.votingType
        }));

        fs.writeFileSync(
            path.join(this.dataDir, 'weighted-polls.json'),
            JSON.stringify(data, null, 2)
        );
    }

    loadPolls() {
        const pollsFile = path.join(this.dataDir, 'weighted-polls.json');
        if (fs.existsSync(pollsFile)) {
            const data = JSON.parse(fs.readFileSync(pollsFile, 'utf8'));
            data.forEach(pollData => {
                const poll = {
                    id: pollData.id,
                    title: pollData.title,
                    description: pollData.description,
                    options: pollData.options.map(opt => ({
                        id: opt.id,
                        text: opt.text,
                        weightedVotes: BigInt(opt.weightedVotes),
                        voters: new Map(
                            opt.voters.map(v => [v.address, BigInt(v.weight)])
                        ),
                        voteCount: opt.voteCount
                    })),
                    createdAt: pollData.createdAt,
                    endsAt: pollData.endsAt,
                    active: pollData.active,
                    minTokensRequired: pollData.minTokensRequired,
                    totalWeightedVotes: BigInt(pollData.totalWeightedVotes),
                    voters: new Map(
                        pollData.voters.map(v => [v.address, BigInt(v.weight)])
                    ),
                    votingType: pollData.votingType
                };
                this.polls.set(poll.id, poll);
                this.pollId = Math.max(this.pollId, poll.id + 1);
            });
        }
    }
}

module.exports = WeightedPollService;
