module Repository = {
  type t;
  type pullrequest = {
    .
    "title": string,
    "head": string,
    "base": string,
    "body": string,
    "maintainer_can_modify": Js.undefined(bool),
  };
  [@bs.send]
  external createPullRequest : (t, pullrequest, 'a => 'b) => Js.Promise.t('c) =
    "";
  [@bs.send]
  external getPullRequest : (t, int, 'a => 'b) => Js.Promise.t('c) = "";
  type listconfig = {
    .
    "state": [ | `open_ | `closed | `all],
    "head": string,
    "base": string,
    "sort": string,
    "direction": string,
  };
  [@bs.send]
  external listPullRequests : (t, listconfig, 'a => 'b) => Js.Promise.t('c) =
    "";
  let makePullRequest =
      (
        ~title: string,
        ~head: string,
        ~base="master",
        ~body="",
        ~maintainer_can_modify: option(bool)=?,
        repo: t,
      ) =>
    createPullRequest(
      repo,
      {
        "title": title,
        "head": head,
        "base": base,
        "body": body,
        "maintainer_can_modify":
          Js.Undefined.fromOption(maintainer_can_modify),
      },
      Js.log,
    );
};

module Issue = {
  type t;
  [@bs.send]
  external listIssueEvents : (t, int, 'a => 'b) => Js.Promise.t('c) = "";
};

type t;

type auth = {
  .
  "username": Js.undefined(string),
  "password": Js.undefined(string),
  "token": Js.undefined(string),
};

[@bs.module] [@bs.new]
external default : Js.undefined(auth) => t = "github-api";

[@bs.send] external getRepo : (t, string, string) => Repository.t = "";

[@bs.send] external getIssues : (t, string, string) => Issue.t = "";

let make = (~username=?, ~password=?, ~token=?, _) =>
  switch (username, password, token) {
  | (None, None, None) => default(Js.Undefined.empty)
  | _ =>
    Js.Undefined.(
      default(
        return({
          "username": fromOption(username),
          "password": fromOption(password),
          "token": fromOption(token),
        }),
      )
    )
  };
