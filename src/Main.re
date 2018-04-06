[@bs.val] external token : string = "process.env.GITHUB_API_TOKEN";

/*j
  GitHub.make(~token, ())
  |> GitHub.getRepo(_, "kogai", "typed_i18n")
  |> GitHub.Repository.getPullRequest(_, 6, Js.log)
  |> Js.Promise.then_(result => {
       Js.log(result);
       Js.Promise.resolve();
     });
     */
GitHub.make(~token, ())
|> GitHub.getIssues(_, "kogai", "typed_i18n")
|> GitHub.Issue.listIssueEvents(_, 10, Js.log)
|> Js.Promise.then_(result => {
     Js.log(result);
     Js.Promise.resolve();
   });
