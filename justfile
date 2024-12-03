set shell := ["bash", "-O", "globstar", "-c"]
set dotenv-filename := ".envrc"

import ".just/git.just"
import ".just/git-rebase.just"
import ".just/git-test.just"

default: dump-icon-sprites sync-icon-sprites

factorio_home := env('FACTORIO_HOME')

dump-icon-sprites:
    {{factorio_home}}/factorio --dump-icon-sprites

sync-icon-sprites:
    mkdir -p {{justfile_directory()}}/script-output/
    rsync -av ~/Library/Application\ Support/factorio/script-output/ {{justfile_directory()}}/script-output/

echo_command := env('ECHO_COMMAND', "echo")
