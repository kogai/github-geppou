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
console.log(fromDay, toDay);

const query = fs.readFileSync("./Query.gql").toString();

let count = 0;
const fetchAll = (xs = [], cursor) => {
  return fetchQuery(query, {
    login: "kogai",
    last: 5,
    before: cursor
  }).then(
    ({
      data: {
        user: { pullRequests: { pageInfo: { endCursor, startCursor }, edges } }
      }
    }) => {
      const ys = edges
        .map(({ node: { title, createdAt } }) => `${createdAt}:${title}`)
        .concat(xs);
      if (count > 2) {
        return Promise.resolve(ys);
      }
      count++;
      return fetchAll(ys, startCursor);
    }
  );
};

fetchAll().then(xs => {
  console.log(xs);
});
