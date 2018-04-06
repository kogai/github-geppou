const fetch = require("node-fetch");

const fetchQuery = (
  query,
  variables,
) => {
  return fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `bearer ${process.env.GITHUB_API_TOKEN}`
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  }).then(response => {
    return response.json();
  }).catch(e => {
    console.error(e);
  });
}

fetchQuery(`
{
  repository(owner:"kogai", name:"typed_i18n") {
    pullRequests(last: 10) {
      edges {
        node {
          title
          createdAt
          closed
          author {
            avatarUrl
            url
          }
        }
      }
    }
  }
}
`).then(({
  data: {
    repository: {
      pullRequests: {
        edges
      }
    }
  }
}) => {
  console.log(edges);
})
