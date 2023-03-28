# GitHub Actions Auto-`.gitmodules`

Git supports a feature named Submodules.
It can be used to link another repository as a dependency of the current one.

Here is the documentation: https://git-scm.com/book/en/v2/Git-Tools-Submodules

Here's how you add a submodule to a repository:

```sh
git submodule add https://github.com/TomasHubelbauer/git-demo-submodule
```

This will clone the linked repository into a directory named after it and it
will create or update a file name `.gitmodules` with the details of the new
submodule.

To remove a submodule, this is the command to use:

```sh
git rm git-demo-submodule
```

The source for this command can be found on Stack Overflow here:
https://stackoverflow.com/a/1260982/2715716

You can add `-f` if the submodule addition has not been committed yet or the
submodule has changes.

To check out or pull a repository with all its submodules, one must use these
commands:

```sh
git clone https://github.com/TomasHubelbauer/github-actions-auto-gitmodules --recurse-submodules
```

Adding `--remote-submodules` will also update submodules to latest.

```sh
git submodule update --recursive --remote
```

The idea of this GitHub Actions workflow is to add logic which runs on every
push and checks for updates into `.gitmodules` made by the user in the GitHub
web UI and then add or remove submodules to match the changes made by the user
and push the changes from the workflow back to the repository.

1. Run `git submodule update --recursive --remote`
2. See if there is a change and if so, push it

This alone should add submodules that users add by hand, I think.
But I don't think it will remove submodules if the user does that by hand.
For that, we need to list the submodules we should be seeing:

`git config --file .gitmodules --name-only --get-regexp path` or maybe just
`git submodule status` will work?

And then we need to walk the directories in the repository and probably just
look for `.git` in them?

Or maybe the deletion in `.submodules` and the subsequent push and submodule
update on the CI will mean that the previously submodule directories are now
just normal directories so they will show up as additions and at the same time
the commit triggering the CI run will be just deletions in the `.gitmodules`
file?
But this sounds pretty janky so I think I will go with the former.

This should also run on schedule every hour or something so that `--remote`
results in submodules that were changed in their original repos to update in
this repository as well!
