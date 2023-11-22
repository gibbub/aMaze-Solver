var cols, rows;
var min_dim = 5;
var max_dim = 30;
var w = 380;
var h = 380;
var grid = [];

var current;
var start;
var end;

var generate_stack = [];
var generating = true;

var solving_current;
var solving = false;
var solve_stack = [];
var unvisited_set = [];

var search_method = $('#algorithms input:radio').val();


/** Generates new maze when generate button is clicked **/
$("#generate").click(function () {
    generating = true;
    grid = [];
    resetGridForSolving();
    $("#solve").disabled = false;
    solving = false;
    setup();
});


/**  Detects change in algorithm selection **/
$('#algorithms input:radio').on('change', function() {
    search_method = $(this).val();    
});


/** Prepares grid & initializes appropriate variables for solving **/
$("#solve").click(function () { 
    resetGridForSolving();

    /** Dijkstra Initialization **/
    if (search_method == "Dijkstra") {

        for (var j = 0; j < rows; j++) {
            for (var i = 0; i < cols; i++) {

                // Set all cells to unvisited
                var curr = grid[index(i,j)];
                curr.visited = false;
                unvisited_set.push(curr);

                // Initialize each cell's distance from start
                if (i == 0 && j == 0) {
                    curr.distance = 0;
                }
                else {
                    curr.distance = Infinity;
                }
            }
        }
    }

    this.disabled = true;
    solving = true;
    solving_current = start;
});


/** Resets cell values to default **/
function resetGridForSolving() {
    for (const cell of grid) {
        cell.visited = false;
        cell.considered = false;
        cell.onPath = false;
    }

    unvisited_set = [];
}


/** Initializes grid **/ 
function setup() {
    createCanvas(w, h);
    rows = document.getElementById("rows").value;
    cols = document.getElementById("cols").value;

    // Make sure rows & cols are valid dimensions
    if (rows < min_dim) {
        document.getElementById("rows").value = min_dim;
        rows = min_dim;
    }
    else if (rows > max_dim) {
        document.getElementById("rows").value = max_dim;
        rows = max_dim;
    }
    if (cols < min_dim) {
        document.getElementById("cols").value = min_dim;
        cols = min_dim;
    }
    else if(cols > max_dim) {
        document.getElementById("cols").value = max_dim;
        cols = max_dim;
    }
    //frameRate(5);

    // Populate grid with cell objects
    for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
            var cell = new Cell(i, j);
            grid.push(cell);
        }
    }

    current = grid[0];
    start = grid[0];
    end = grid[index(cols-1, rows-1)];
    solving_current = start;
}


/** Draws  & solves maze **/ 
function draw() {

    ////****     MAZE GENERATION     ****////
    for (var i = 0; i < grid.length; i++) {
        grid[i].show();
    }

    current.generated = true;
    current.highlight();

    var next = current.checkNeighbors();

    if (next) {
        next.generated = true;
        generate_stack.push(current);
        removeWalls(current, next);
        current = next;
    }
    else if (generate_stack.length > 0) {
        current = generate_stack.pop();
    }

    if (generate_stack.length == 0) {
        start.setStart();
        end.setEnd();
        generating = false;
    }


    ////****     MAZE SOLVING     ****////
    if (generating || solving) {
        document.getElementById("solve").disabled = true;  
    }
    else {
        document.getElementById("solve").disabled = false;
    }

    if (solving) {
        switch (search_method) {
            case "DFS":   
                dfs();        
                break;

            case "Dijkstra":
                dijkstra();
                break;

            case "AStar":
                //TODO
                aStar();
                break;

            case "DijkstraDrawPath":
                drawPath("Dijkstra");
                break;
                
            default:
                console.log("Error: invalid search method");
        }
    }
}


/** Performs DFS search **/
function dfs() {
    solving_current.visited = true;
    solving_current.onPath = true;
    solving_current.highlight();

    if (solving_current == end ) {
        solving = false;
        document.getElementById("solve").disabled = false;
    }

    solve_stack.push(solving_current);

    if (solve_stack.length > 0) {

        solving_current = solve_stack.pop();

            var adj_cells = solving_current.adjacentUnvisitedCells();
            for (const n of adj_cells) {
                solve_stack.push(n);
            }
            
        solving_current = solve_stack.pop();
    }
}


/** Performs Dijkstra search **/
function dijkstra() {
    var adj_cells = solving_current.adjacentUnvisitedCells();
    for (const n of adj_cells) {
        var new_distance = solving_current.distance + 1;

        if (new_distance < n.distance) {
            n.distance = new_distance;
            n.prev = solving_current;
        }
    }

    solving_current.visited = true;
    unvisited_set.splice(unvisited_set.indexOf(solving_current), 1);
    solving_current.highlight();
    solving_current.considered = true;

    if (end.visited) {
        search_method = "DijkstraDrawPath";
        solving_current = end;
    }
    else {
        var min_distance = Infinity;
        var min_cell = undefined;
        for (const c of unvisited_set) {
            if (c.distance < min_distance) {
                min_distance = c.distance;
                min_cell = c;
            }
        }
        solving_current = min_cell;
    }
}


/** Performs A* search **/
function aStar() {
    // TODO
}


/** Helper function for certain search methods, which backtracks through visited cells to draw the shortest path */
function drawPath(method) {
    if (solving_current == start) {
        solving = false;
        document.getElementById("solve").disabled = false;
        search_method = method;
    }
    
    solving_current.highlight();
    solving_current.onPath = true;
    var prev = solving_current.prev;
    solving_current = prev;
}


/** Helper function which finds index of cell (i,j) in a 1D array **/
function index (i, j) {
    // edge cases
    if (i < 0 || j < 0 || i > cols-1 || j > rows-1) {
        return -1;
    }

    return i + j * cols;
}


/** Cell object which populates the grid **/
function Cell(i, j) {
    this.i = i;
    this.j = j;
    this.distance = Infinity;
    this.prev = undefined;
    this.walls = [true, true, true, true];  // top, right, bottom, left
    this.generated = false;                 // for maze generation
    this.visited = false;                   // for maze solving
    this.considered = false;                // for visualizing solver before path is generated
    this.onPath = false;

    this.setStart = function() {
        var cw = w/cols;    // cell width
        var ch = h/rows;    // cell height
        var x = this.i*cw;
        var y = this.j*ch;

        noStroke();
        fill(32, 178, 170, 100);
        rect(x, y, cw, ch);
    }

    this.setEnd = function() {
        var cw = w/cols;    // cell width
        var ch = h/rows;    // cell height
        var x = this.i*cw;
        var y = this.j*ch;

        noStroke();
        fill(220, 20, 60, 100);
        rect(x, y, cw, ch);
    }

    /** Checks for valid neighbors and returns a random one **/
    this.checkNeighbors = function() {
        var neighbors = [];

        var top = grid[index(i, j-1)];
        var right = grid[index(i+1, j)];
        var bottom = grid[index(i, j+1)];
        var left = grid[index(i-1, j)];

        if (top && !top.generated) {
            neighbors.push(top);
        }
        if (right && !right.generated) {
            neighbors.push(right);
        }
        if (bottom && !bottom.generated) {
            neighbors.push(bottom);
        }
        if (left && !left.generated) {
            neighbors.push(left);
        }

        // pick random neighbor
        if (neighbors.length > 0) {
            var r = floor(random(0, neighbors.length));
            return neighbors[r];
        }
        else {
            return undefined;
        }
    }

    /** Returns list of all valid adjacent cells **/
    this.adjacentUnvisitedCells = function() {
        var adj_cells = [];

        var top = grid[index(i, j-1)];
        var right = grid[index(i+1, j)];
        var bottom = grid[index(i, j+1)];
        var left = grid[index(i-1, j)];

        if (top && !top.visited && !this.walls[0]) {
            adj_cells.push(top);
        }
        if (right && !right.visited && !this.walls[1]) {
            adj_cells.push(right);
        }
        if (bottom && !bottom.visited && !this.walls[2]) {
            adj_cells.push(bottom);
        }
        if (left && !left.visited && !this.walls[3]) {
            adj_cells.push(left);
        }

        return adj_cells;
    }

    /** Highlights current cell **/
    this.highlight = function() {
        var cw = w/cols;    // cell width
        var ch = h/rows;    // cell height
        var x = this.i*cw;
        var y = this.j*ch;

        noStroke();
        fill(219, 75, 75, 100);
        rect(x, y, cw, ch);
        
    }

    /** Displays the cell **/
    this.show = function() {
        var cw = w/cols;    // cell width
        var ch = h/rows;    // cell height
        var x = this.i*cw;
        var y = this.j*ch;
        stroke(24, 25, 89);

        // Draws walls if they have not been removed
        if (this.walls[0]) {
            line(x,      y,      x + cw, y);        // top  
        }
        if (this.walls[1]) {
            line(x + cw, y,      x + cw, y + ch);   // right
        }
        if (this.walls[2]) {
            line(x + cw, y + ch, x,      y + ch);   // bottom
        }
        if (this.walls[3]) {
            line(x,      y + ch, x,      y);        // left
        }

        // Colors in cell if it has been generated or visited
        if (this.visited && this.onPath) {
            noStroke();
            fill(32, 178, 170, 5);
            rect(x, y, cw, ch);
        }
        else if (this.considered) {
            noStroke();
            fill(32, 178, 170, 0);
            rect(x, y, cw, ch);
        }
        else if (this.generated) {
            noStroke();
            fill(237, 169, 133, 80);
            rect(x , y, cw, ch);
        }

        /**       Cell Diagram
         * 
         *     (x,y) _______ (x+cw, y)
         *          |       |
         *          |       |
         *  (x,y+ch)|_______|(x+cw, y+ch)
         */
    }
}


/** Helper function which removes the walls between the current cell and a random chosen neighbor **/
function removeWalls(a, b) {
    var x = a.i - b.i;
    var y = a.j - b.j;

    if (x == 1) {           // remove a's LEFT wall & b's RIGHT wall
        a.walls[3] = false;
        b.walls[1] = false;
    }
    else if (x == -1) {     // remove a's RIGHT wall & b's LEFT wall
        a.walls[1] = false;
        b.walls[3] = false;
    }
    
    if (y == 1) {           // remove a's TOP wall & b's BOTTOM wall
        a.walls[0] = false;
        b.walls[2] = false;
    }
    else if (y == -1) {     // remove a's BOTTOM wall & b's TOP wall
        a.walls[2] = false;
        b.walls[0] = false;
    }

}
