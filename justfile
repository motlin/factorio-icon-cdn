set shell := ["bash", "-O", "globstar", "-c"]
set dotenv-filename := ".envrc"

import ".just/git.just"
import ".just/git-rebase.just"
import ".just/git-test.just"

default: dump-icon-sprites sync-icon-sprites

factorio_home := env('FACTORIO_HOME')
script_output_home := env('FACTORIO_SCRIPT_OUTPUT_HOME')

dump-icon-sprites:
    rm -rf {{script_output_home}}/script-output/
    {{factorio_home}}/factorio --verbose --dump-icon-sprites --dump-data
    echo '{{script_output_home}}/script-output/'
    ls {{script_output_home}}/script-output/

sync-icon-sprites:
    mkdir -p {{justfile_directory()}}/script-output/
    rsync -av {{script_output_home}}/script-output/ {{justfile_directory()}}/script-output/
    npm install
    npm run optimize:images

echo_command := env('ECHO_COMMAND', "echo")
