const fs = require("fs");
const fetch = require("node-fetch");
const clipoardy = require("clipboardy");
const im = require("immutable");

const fetchQuery = (query, variables) => {
  return fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${process.env.GITHUB_API_TOKEN}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    })
    .then(response => {
      return response.json();
    })
    .catch(e => {
      console.error(e);
    });
};

const isUptoDate = (xs, edges) => xs.length === 0 &&
  edges.every(({
    node: {
      createdAt
    }
  }) => fromDay.getTime() >= new Date(createdAt).getTime());

const fromDay = new Date("2018-06-01");
const toDay = new Date("2018-06-31");

const pullRequest = fs.readFileSync("./PullRequest.gql").toString();
const repository = fs.readFileSync("./Repository.gql").toString();
const user = "kogai";

const fetchPullRequests = (query, xs = [], cursor = undefined) => {
  return fetchQuery(query, {
    login: user,
    last: 25,
    before: cursor
  }).then(
    ({
      data: {
        user: {
          pullRequests: {
            pageInfo: {
              endCursor,
              startCursor
            },
            edges
          }
        }
      }
    }) => {
      const ys = edges
        .filter(({
          node: {
            createdAt
          }
        }) => {
          const d = new Date(createdAt);
          return (
            fromDay.getTime() <= d.getTime() && toDay.getTime() >= d.getTime()
          );
        })
        .map(({
          node: {
            title,
            createdAt,
            url,
            author,
            repository
          }
        }) => {
          return {
            title,
            createdAt,
            url,
            author,
            repository
          };
        });
      if (isUptoDate(ys, edges)) {
        return Promise.resolve(ys.concat(xs));
      }
      console.log(
        "Fetching %dth events of pull requests...",
        ys.concat(xs).length
      );
      return fetchPullRequests(query, ys.concat(xs), startCursor);
    }
  );
};

const fetchRepositories = (query, xs = [], cursor = undefined) =>
  fetchQuery(query, {
    login: user,
    last: 25,
    before: cursor
  }).then(
    ({
      data: {
        user: {
          repositories: {
            pageInfo: {
              endCursor,
              startCursor
            },
            edges
          }
        }
      }
    }) => {
      const ys = edges
        .filter(({
          node: {
            isFork,
            isPrivate
          }
        }) => !isFork && !isPrivate)
        .filter(({
          node: {
            createdAt
          }
        }) => {
          const d = new Date(createdAt);
          return (
            fromDay.getTime() <= d.getTime() && toDay.getTime() >= d.getTime()
          );
        })
        .map(({
          node: {
            name,
            createdAt,
            owner,
            url
          }
        }) => ({
          name,
          createdAt,
          owner,
          url
        }));
      if (isUptoDate(ys, edges)) {
        return Promise.resolve(ys.concat(xs));
      }
      console.log(
        "Fetching %dth events on repositories...",
        ys.concat(xs).length
      );
      return fetchRepositories(query, ys.concat(xs), startCursor);
    }
  );

const groupRequest = xs =>
  im.List(xs).groupBy(
    ({
      repository: {
        name,
        owner: {
          login
        }
      }
    }) => `${login}/${name}`
  );

const groupRepository = xs =>
  im.List(xs).groupBy(({
    name,
    owner: {
      login
    }
  }) => `${login}/${name}`);

const formatElement = ({
  title,
  createdAt,
  url,
  author,
  repository,

  name,
  owner
}) => {
  const d = new Date(createdAt);
  const date = `${d.getMonth() + 1}/${d.getDate()}`;
  if (name && owner) {
    return `* ${date}: Repository was created`;
  }
  return `* ${date}: [${title}](${url})`;
};

Promise.all([
  fetchPullRequests(pullRequest),
  fetchRepositories(repository)
]).then(([prs, repos]) => {
  const result = groupRequest(prs)
    .mergeDeep(groupRepository(repos))
    .map((ys) => ys.map(formatElement))
    .map(ys => ys.join("\n"))
    .reduce((acc, v, k) => acc.push(`### ${k}\n\n${v}`), im.List())
    .join("\n\n\n");
  console.log(result);
  clipoardy.write(result);
});
