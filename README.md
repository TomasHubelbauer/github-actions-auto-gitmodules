# GitHub Actions Auto-`.gitmodules`

Git supports a feature named Submodules.
It can be used to link another repository as a dependency of the current one.

Here is the documentation: https://git-scm.com/book/en/v2/Git-Tools-Submodules

## Adding a submodule

```sh
git submodule add https://github.com/TomasHubelbauer/git-demo-submodule
```

This will:

- Clone the linked repository into a directory named after it
- Create a directory in `.git/modules` for the submodule
- Update the `.git/config` file to add a new `submodule` section
- Create or update a file name `.gitmodules`

## Removing a submodule

```sh
# Remove the directory of the submodule repository
# Use `--cached` in case the submodule directory was not committed yet
# Use `--force` if the submodule has changes that have not been committed yet
git rm git-demo-submodule

# Remove the directory of the submodule directory in `.git/modules`
rm -rf .git/modules/git-demo-submodule

# Remove the entry of the submodule in `.git/config`
git config --remove-section submodule.git-demo-submodule
```

Sources:

- https://stackoverflow.com/a/1260982/2715716
- https://stackoverflow.com/a/35778105/2715716

## Checking out with submodules

Clone with submodules:

```sh
# Add `--remote-submodules` to also update the submodules to latest
git clone https://github.com/TomasHubelbauer/github-actions-auto-gitmodules --recurse-submodules
```

Update submodules:

```sh
# Add `--remote` to update the submodule to latest
git submodule update --recursive
```

## This workflow idea

This workflow's purpose is to make it possible to add and remove submodules from
a repository just by editing the `.gitmodules` file in the GitHub web editor and
having the workflow do the rest.

This will prevent the need to check out the repository in order to add or remove
submodules from it.

To achieve this, the workflow will run on pushes and see if the state of the
submodules file matches the expected contents of the `.git/modules` folder and
the `.git/config` submodule sections.

Additions will probably be easy enough to do just by running the submodule
update command which I think should add the submodules' components to the config
file and the `.git/modules` directory after they've been added to the modules
file.

`git submodule update --recursive --remote`

Removals might get trickier as the update won't remove the other files/folders
if the submodule is removed from the modules file.
To make this work, likely the workflow will need to list both the modules file
entries and the config file entries, `.git/modules` subdirectories and the repo
directories, diff the sets and recognize what it needs to delete:

- List all entries in `.gitmodules`
- Remove all directories in `.git/modules` that do not have a match
- Remove all submodule sections in `.git/config` which do not have a match
- Remove all repository directories associated with the above removed entries

We'll also do this for additions if the simple submodule update idea as per the
above doesn't work.

After every push, if changes were generated resulting from the submodule changes
then we commit them and push them back to the workflow repository.

We'll also have the workflow run on schedule because the use of `--remote` means
even if no submodules were added or removed, they might have still updated and
we need to notice that, commit it and push it to the workflow repository, too.

## Draft area

- Checking out with submodules after removing `.gitmodules` only but not the
  corresponding other entries causes an error and exits with code 128:
  > fatal: No url found for submodule path
  - We might need to always check out without submodules, process the changes
    first and then try checking out submodules one by one or someting?

## Tasks

### Figure out why the push from the workflow is failing with a 403

Is it possible that I've only ever used the push workflow with public repos and
it doesn't work with private ones and I just never noticed?

Or did I mess something up in it?
It works for other of my repositories so I need to check it against them.
