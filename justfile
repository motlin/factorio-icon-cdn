set dotenv-filename := ".envrc"

# `just --list --unsorted`
default:
    @just --list --unsorted

# dump-icon-sprites and sync-icon-sprites
all: dump-icon-sprites sync-icon-sprites

factorio_home := env('FACTORIO_HOME')
script_output_home := env('FACTORIO_SCRIPT_OUTPUT_HOME')

# `factorio --verbose --dump-icon-sprites`
dump-icon-sprites:
    rm -rf {{script_output_home}}/script-output/
    mkdir -p {{script_output_home}}/script-output/
    {{factorio_home}}/factorio --verbose --dump-icon-sprites
    echo '{{script_output_home}}/script-output/'
    ls {{script_output_home}}/script-output/

# `rsync` script-output
sync-icon-sprites:
    mkdir -p {{justfile_directory()}}/script-output/
    rsync -av {{script_output_home}}/script-output/ {{justfile_directory()}}/script-output/
    npm install
    npm run optimize:images

echo_command := env('ECHO_COMMAND', "echo")
