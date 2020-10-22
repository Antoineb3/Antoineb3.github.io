'use strict';
const debug = true;
let dbg = console.log.bind(console, 'Dbg:');

// View Controller
$(function () {
    // Controller variables
    const DIFFICULTIES = {
        easy: { width: 10, height: 8, mines: 10 },
        medium: { width: 18, height: 14, mines: 40 },
        hard: { width: 24, height: 20, mines: 99 }
    };

    const COLORS = {
        '1': 'blue',
        '2': 'green',
        '3': 'red',
        '4': 'purple',
        '5': 'maroon',
        '6': 'turquoise',
        '7': 'black',
        '8': 'gray'
    };

    let game = new MSGame();

    let dificulty = 'easy';

    let timer = null;

    let time = 0;

    // Execute when page loads
    $.event.special.tap.tapholdThreshold = 1000;
    $.event.special.tap.emitTapOnTaphold = false;
    prepare_top_pannel();
    load_game();

    // Prepares the top pannel of the game by preparing the DOM and regestering callbacks
    function prepare_top_pannel() {
        debug && dbg('preparing dificulties');

        // Add all dificulties to dropdown
        dbg(Object.keys(DIFFICULTIES));
        for (let dif in DIFFICULTIES) {
            $('#difficulties').append(`<option value="${dif}">${dif}</option>`);
        }
        // Display selected difficulty in dropdown
        $('#difficulties-button span').text(dificulty);

        // Callbacks
        $('#difficulties').bind('change', change_dificulty);
        $('.reload').bind('tap', load_game);
    }

    // Loads the game board
    function load_game() {
        debug && dbg('loading game board');
        prepeare_game_board(DIFFICULTIES[dificulty]);
        register_callbacks();
        render();
    }

    // Creates the DOM for the game board
    function prepeare_game_board(dificulty) {
        debug && dbg('creating game board');
        game.init(dificulty.height, dificulty.width, dificulty.mines);
        time = 0;
        stop_timer();
        $('#game_results').text('Press any tile to start the game')

        let window_width = $(window).width();
        let cell_size = 10;
        if (window_width >= 800) {
            cell_size = 800 / dificulty.width;
        } else {
            cell_size = window_width / dificulty.width;
        }

        let game_panel = $('#game_panel');
        game_panel.empty();
        for (let i = 0; i < game.getStatus().nrows; i++) {
            let row = '<div class="row align-items-center no-gutters">';
            for (let j = 0; j < game.getStatus().ncols; j++) {
                row += '<div id="' + i + 'x' + j + '" class="col game_cell" style="width:' + cell_size + 'px; height:' + cell_size + 'px;"></div>';
            }
            row += '</div>';
            game_panel.append(row);
        }
    }

    // Creates the DOM for the game board
    function register_callbacks() {
        debug && dbg('regestering callbacks');
        $('.game_cell').bind('taphold', { duration: 10000 }, flag);
        $('.game_cell').bind('contextmenu', flag);
        $('.game_cell').bind('tap', uncover);
    }

    // Renders the game board
    function render() {
        debug && dbg('rendering board');
        let status = game.getStatus();

        $('#bomb_count').text(status.nmines - status.nmarked);
        $('#timer').text(time);

        $('#game_panel').find('.game_cell').each(function () {
            let set_background = function (even_color = "#acd454", odd_color = "#a2d149") {
                if (((i + j) % 2)) {
                    cell.css("background-color", even_color);
                }
                else {
                    cell.css("background-color", odd_color);
                }
            }

            let cell = $(this);
            let i = getRow(this);
            let j = getCol(this);
            let value = game.getRendering()[i][j];

            // Reset styles
            cell.removeClass('hover');
            cell.removeClass('flag');
            cell.removeClass('mine');
            cell.text('');
            cell.css("background", '');
            // Set styles
            if (value === 'H') {
                set_background();
                cell.addClass('hover');
            }
            else if (value === 'F') {
                set_background();
                cell.addClass('hover');
                cell.addClass('flag');
            }
            else if (value === 'M') {
                set_background();
                cell.addClass('mine');
            }
            else {
                set_background("#e4c49c", "#d4bc9c");
                if (value !== '0') {
                    cell.text(value);
                    cell.css("color", COLORS[value]);
                }
            }
        });
    }

    // Ends the game by displaying apropriate popup
    function end_game() {
        debug && dbg('Ending the game');
        stop_timer();
        $('#game_results').show();
        if(game.getStatus().exploded){
            $('#game_results').text('BOOM!')
        }
        else{
            $('#game_results').text('You Win! Time: ' + time + 's')
        }
    }

    // Uncovers a cell on the game board if allowed.
    // Starts and ends game when apropriate
    function uncover(event) {
        debug && dbg('uncovering');

        let status = game.getStatus();
        if (status.nuncovered === 0) {
            start_timer();
            $('#game_results').text('Find the Mines!')
        }
        if (!status.done && game.uncover(getRow(event.target), getCol(event.target))) {
            render();
            status = game.getStatus();
            if (status.done) {
                end_game();
            }
        }
    }

    // Marks a cell on the game board if allowed.
    function flag(event) {
        debug && dbg('flagging');
        event.preventDefault();

        let status = game.getStatus();
        if (!status.done && game.mark(getRow(event.currentTarget), getCol(event.currentTarget))) {
            render();
        }
    }

    // Changes the dificulty
    function change_dificulty(event) {
        debug && dbg('changing dificulty');
        let selected_dificulty = event.target.value;
        if (selected_dificulty !== dificulty) {
            dificulty = selected_dificulty;
            load_game();
        }
    }

    function start_timer() {
        debug && dbg('starting the timer');
        timer = setInterval(() => $('#timer').text(++time), 1000);
    }

    function stop_timer() {
        debug && dbg('stopping the timer');
        if (timer !== null) {
            clearInterval(timer);
        }
    }

    function getRow(cell) {
        return getIndex(cell)[0];
    }

    function getCol(cell) {
        return getIndex(cell)[1];
    }

    function getIndex(cell) {
        return $(cell).attr('id').split('x').map(str => Number(str));
    }

});