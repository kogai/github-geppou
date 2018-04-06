const fs = require("fs");
const fetch = require("node-fetch");

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

const fromDay = new Date("2018-03-01");
const toDay = new Date("2018-03-31");

const query = fs.readFileSync("./Query.gql").toString();
const user = "kogai";

const fetchAll = (xs = [], cursor) => {
  return fetchQuery(query, {
    login: user,
    last: 50,
    before: cursor
  }).then(
    ({
      data: {
        user: { pullRequests: { pageInfo: { endCursor, startCursor }, edges } }
      }
    }) => {
      const ys = edges
        .filter(({ node: { createdAt } }) => {
          const d = new Date(createdAt);
          return (
            fromDay.getTime() <= d.getTime() && toDay.getTime() >= d.getTime()
          );
        })
        .map(({ node: { title, createdAt, url, author } }) => {
          const d = new Date(createdAt);
          const date = `${d.getMonth() + 1}/${d.getDate()}`;
          return `* ${date}: [${title}](${url}) [@${user}](${author.url})`;
        });
      if (
        ys.length === 0 &&
        edges.every(({ node: { createdAt } }) => {
          const d = new Date(createdAt);
          return fromDay.getTime() >= d.getTime();
        })
      ) {
        return Promise.resolve(ys.concat(xs));
      }
      console.log("Fetching %dth events...", ys.concat(xs).length);
      return fetchAll(ys.concat(xs), startCursor);
    }
  );
};

fetchAll().then(xs => {
  console.log(xs.join("\n"));
});
