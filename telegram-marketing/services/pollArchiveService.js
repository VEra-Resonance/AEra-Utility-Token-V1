const fs = require('fs');
const path = require('path');

class PollArchiveService {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.archiveDir = path.join(this.dataDir, 'archives');
        this.reportsDir = path.join(this.dataDir, 'reports');
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.dataDir, this.archiveDir, this.reportsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    archivePoll(pollData) {
        const archiveEntry = {
            archivedAt: Date.now(),
            ...pollData,
            status: 'archived'
        };

        const filename = `poll-${pollData.id}-${Date.now()}.json`;
        const filepath = path.join(this.archiveDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(archiveEntry, null, 2));

        // Add to index
        this.addToArchiveIndex({
            id: pollData.id,
            title: pollData.title,
            filename,
            archivedAt: archiveEntry.archivedAt,
            duration: pollData.endsAt - pollData.createdAt
        });

        return archiveEntry;
    }

    addToArchiveIndex(entry) {
        const indexPath = path.join(this.archiveDir, 'index.json');
        let index = [];

        if (fs.existsSync(indexPath)) {
            index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }

        index.push(entry);
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    }

    getArchivedPoll(pollId) {
        const indexPath = path.join(this.archiveDir, 'index.json');
        if (!fs.existsSync(indexPath)) return null;

        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        const entry = index.find(e => e.id === pollId);

        if (!entry) return null;

        const filepath = path.join(this.archiveDir, entry.filename);
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }

    getAllArchivedPolls() {
        const indexPath = path.join(this.archiveDir, 'index.json');
        if (!fs.existsSync(indexPath)) return [];

        return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }

    generatePollReport(pollData) {
        const report = {
            generatedAt: Date.now(),
            pollId: pollData.id,
            title: pollData.title,
            description: pollData.description,
            duration: {
                start: new Date(pollData.createdAt).toISOString(),
                end: new Date(pollData.endsAt).toISOString(),
                durationMs: pollData.endsAt - pollData.createdAt
            },
            summary: {
                totalVoters: pollData.voters.size || 0,
                totalWeightedVotes: pollData.totalWeightedVotes?.toString() || '0',
                options: pollData.options.length,
                status: pollData.active ? 'Active' : 'Completed'
            },
            results: this.calculateResults(pollData),
            topVoters: this.getTopVoters(pollData),
            metadata: {
                votingType: pollData.votingType || 'standard',
                minTokensRequired: pollData.minTokensRequired || 0
            }
        };

        return report;
    }

    calculateResults(pollData) {
        const totalVotes = pollData.totalWeightedVotes || pollData.totalVotes || 1;

        return pollData.options
            .map((opt, idx) => ({
                rank: idx + 1,
                option: opt.text,
                votes: opt.weightedVotes?.toString() || opt.votes?.toString() || '0',
                percentage: totalVotes > 0n
                    ? ((BigInt(opt.weightedVotes || opt.votes || 0) * 100n) / BigInt(totalVotes)).toString()
                    : '0',
                voterCount: opt.voteCount || opt.voters?.length || 0
            }))
            .sort((a, b) => parseInt(b.votes) - parseInt(a.votes))
    }

    getTopVoters(pollData, limit = 10) {
        if (!pollData.voters) return [];

        return Array.from(pollData.voters.entries ? pollData.voters.entries() : [])
            .map(([address, weight]) => ({
                address,
                weight: weight.toString ? weight.toString() : weight,
                percentage: pollData.totalWeightedVotes
                    ? ((BigInt(weight) * 100n) / BigInt(pollData.totalWeightedVotes)).toString()
                    : '0'
            }))
            .sort((a, b) => parseInt(b.weight) - parseInt(a.weight))
            .slice(0, limit);
    }

    exportReportAsCSV(report) {
        let csv = `Poll Report: ${report.title}\n`;
        csv += `Generated: ${new Date(report.generatedAt).toISOString()}\n\n`;

        csv += `Summary:\n`;
        csv += `Total Voters,${report.summary.totalVoters}\n`;
        csv += `Total Weighted Votes,${report.summary.totalWeightedVotes}\n`;
        csv += `Status,${report.summary.status}\n\n`;

        csv += `Results:\n`;
        csv += `Rank,Option,Votes,Percentage,Voters\n`;
        report.results.forEach(res => {
            csv += `${res.rank},"${res.option}",${res.votes},${res.percentage}%,${res.voterCount}\n`;
        });

        csv += `\nTop Voters:\n`;
        csv += `Address,Weight,Percentage\n`;
        report.topVoters.forEach(voter => {
            csv += `${voter.address},${voter.weight},${voter.percentage}%\n`;
        });

        return csv;
    }

    exportReportAsJSON(report, pollId) {
        const filename = `report-poll-${pollId}-${Date.now()}.json`;
        const filepath = path.join(this.reportsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

        return {
            filename,
            filepath,
            size: fs.statSync(filepath).size
        };
    }

    getReportHistory(limit = 50) {
        if (!fs.existsSync(this.reportsDir)) return [];

        return fs.readdirSync(this.reportsDir)
            .map(filename => {
                const filepath = path.join(this.reportsDir, filename);
                const stats = fs.statSync(filepath);
                return {
                    filename,
                    createdAt: stats.birthtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    getStatistics() {
        const archives = this.getAllArchivedPolls();
        const reports = this.getReportHistory(1000);

        return {
            archivedPolls: archives.length,
            generatedReports: reports.length,
            oldestArchive: archives.length > 0 
                ? new Date(archives[0].archivedAt).toISOString() 
                : null,
            latestArchive: archives.length > 0
                ? new Date(archives[archives.length - 1].archivedAt).toISOString()
                : null,
            storageUsed: this.calculateStorageUsed()
        };
    }

    calculateStorageUsed() {
        let total = 0;

        const walkDir = (dir) => {
            fs.readdirSync(dir).forEach(file => {
                const filepath = path.join(dir, file);
                const stats = fs.statSync(filepath);
                if (stats.isDirectory()) {
                    walkDir(filepath);
                } else {
                    total += stats.size;
                }
            });
        };

        walkDir(this.dataDir);
        return (total / 1024 / 1024).toFixed(2); // MB
    }
}

module.exports = new PollArchiveService();
