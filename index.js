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

const fromDay = new Date("2018-06-01");
const toDay = new Date("2018-06-31");

const pullRequest = fs.readFileSync("./PullRequest.gql").toString();
const repository = fs.readFileSync("./Repository.gql").toString();
const user = "kogai";

const fetchAll = (query, xs = [], cursor = undefined) => {
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
      if (
        ys.length === 0 &&
        edges.every(({
          node: {
            createdAt
          }
        }) => {
          const d = new Date(createdAt);
          return fromDay.getTime() >= d.getTime();
        })
      ) {
        return Promise.resolve(ys.concat(xs));
      }
      console.log("Fetching %dth events...", ys.concat(xs).length);
      return fetchAll(query, ys.concat(xs), startCursor);
    }
  );
};

const groupElement = (acc, x) => {
  const {
    repository: {
      name,
      owner: {
        login
      }
    }
  } = x;
  acc[`${login}/${name}`] ? acc : acc;
};

const formatElement = ({
  createdAt,
  title,
  url,
  author,
  repository
}) => {
  const d = new Date(createdAt);
  const date = `${d.getMonth() + 1}/${d.getDate()}`;
  return `* ${date}: [${title}](${url})`;
};

const format = xs =>
  im
  .List(xs)
  .groupBy(({
    repository: {
      name,
      owner: {
        login
      }
    }
  }) => {
    return `${login}/${name}`;
  })
  .map((ys, k) => ys.map(formatElement))
  .map(ys => ys.join("\n"))
  .reduce((acc, v, k) => acc.push(`### ${k}\n\n${v}`), im.List())
  .join("\n\n\n");

fetchAll(pullRequest)
  .then(format)
  .then(x => {
    console.log(x);
    clipoardy.write(x);
  });
