const Mustache = require("mustache");
const fs = require("fs");
const request = require("then-request");
const README_TEMPLATE = "./template/readme.mustache";
const config = require("./config.json");

const Github = {
	getCommitUrl: function(userId, repository) {
		return `https://api.github.com/repos/${userId}/${repository}/commits`;
	}
};

const getCommits = async () => {
	let commits = [];
	const length = config.GitHubUsers.length;

	for (let i = 0; i < length; i++) {
		const user = config.GitHubUsers[i];
		const item = {};
		let response = null;

		response = await request("GET", Github.getCommitUrl(user, "dotfiles"), {
			headers: {
				"User-Agent": "then-request"
			}
		});

		if (response.statusCode === 200) {
			response = JSON.parse(response.getBody());
			item.user = response[0];
			item.user.commit.author.date = new Date(item.user.commit.author.date).toDateString();
			item.commits = response.length;
			// eslint-disable-next-line camelcase
			item.commits_url = /^.*commit/.exec(item.user.html_url)[0] + "s";
			item.number = commits.push(item);
		}
	}

	return commits;
};

async function main() {
	const data = {
		commits: await getCommits()
	};

	fs.readFile(README_TEMPLATE, (error, template) => {
		if (error) {
			throw error;
		}
		const output = Mustache.render(template.toString(), data);
		fs.writeFileSync("README.md", output);
	});
}

main();