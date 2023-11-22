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
var undiscovered_set = [];

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


$('#algorithms input:radio').on('change', function() {
    search_method = $(this).val();    
});

$("#solve").click(function () { 
    resetGridForSolving();

    /** Dijkstra Initialization **/
    if (search_method == "Dijkstra") {

        for (var j = 0; j < rows; j++) {
            for (var i = 0; i < cols; i++) {

                // Set all cells to undiscovered
                var curr = grid[index(i,j)];
                curr.discovered = false;
                undiscovered_set.push(curr);

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

function resetGridForSolving() {
    for (const cell of grid) {
        cell.discovered = false;
        cell.onPath = false;
    }

    undiscovered_set = [];
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

    current.visited = true;
    current.highlight();

    // pick random neighbor
    var next = current.checkNeighbors();
    if (next) {
        next.visited = true;

        // push current cell to stack
        generate_stack.push(current);

        // remove wall between current and chosen cell
        removeWalls(current, next);

        // set chosen cell as current cell
        current = next;
    }
    else if (generate_stack.length > 0) {    // if no valid neighbors & generate_stack is not empty
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
    solving_current.discovered = true;
    solving_current.onPath = true;
    solving_current.highlight();

    if (solving_current == end ) {
        //console.log("Done solving");
        solving = false;
        document.getElementById("solve").disabled = false;
    }

    solve_stack.push(solving_current);

    if (solve_stack.length > 0) {

        solving_current = solve_stack.pop();

            var adj_cells = solving_current.adjacentUndiscoveredCells();
            for (const n of adj_cells) {
                solve_stack.push(n);
            }
            
        solving_current = solve_stack.pop();
    }
}


/** Performs Dijkstra search **/
function dijkstra() {
    // TODO
    // 1. Mark all cells unvisited. Create a set of unvisted cells
    //      DONE during solve button click

    // 2. Assign every cell a distance value. (This will be distance from start cell)
    //    Set it to 0 for start node, and infinity for all other nodes.
    //      DONE during solve button click

    // 3. For current cell, consider all unvisted neighbors and calculate their
    //    tentative distances through the current node. If the new distance between those
    //    cells is smaller, choose that distance.
    var adj_cells = solving_current.adjacentUndiscoveredCells();
    for (const n of adj_cells) {
        var new_distance = solving_current.distance + 1;

        if (new_distance < n.distance) {
            n.distance = new_distance;
        }
    }

    // 4. After visiting all unvisited neighbors of the current cell,
    //    mark the current cell as visited and remove it from the unvisited set.
    solving_current.discovered = true;
    solving_current.highlight();

    undiscovered_set.splice(undiscovered_set.indexOf(solving_current), 1);

    // 5. If the destination cell has been marked visited, the stop.
    if (end.discovered) {
        search_method = "DijkstraDrawPath";
        solving_current = end;
    }
    else {
        // 6. Else, select the unvisited cell that is marked with the smallest tentative distance,
        //    set it as the new current cell, and go back to step 3.
        var min_distance = Infinity;
        var min_cell = undefined;
        for (const c of undiscovered_set) {
            if (c.distance < min_distance) {
                min_distance = c.distance;
                min_cell = c;
            }
        }

        min_cell.prev = solving_current;
        solving_current = min_cell;
    }

}


/** Performs A* search **/
function aStar() {
    // TODO
}


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
    this.visited = false;                   // for maze generation
    this.discovered = false;                // for maze solving
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

        if (top && !top.visited) {
            neighbors.push(top);
        }
        if (right && !right.visited) {
            neighbors.push(right);
        }
        if (bottom && !bottom.visited) {
            neighbors.push(bottom);
        }
        if (left && !left.visited) {
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
    this.adjacentUndiscoveredCells = function() {
        var adj_cells = [];

        var top = grid[index(i, j-1)];
        var right = grid[index(i+1, j)];
        var bottom = grid[index(i, j+1)];
        var left = grid[index(i-1, j)];

        if (top && !top.discovered && !this.walls[0]) {
            adj_cells.push(top);
        }
        if (right && !right.discovered && !this.walls[1]) {
            adj_cells.push(right);
        }
        if (bottom && !bottom.discovered && !this.walls[2]) {
            adj_cells.push(bottom);
        }
        if (left && !left.discovered && !this.walls[3]) {
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

        // Colors in cell if it has been visited or discovered
        if (this.discovered && this.onPath) {
            noStroke();
            fill(32, 178, 170, 5);
            rect(x, y, cw, ch);
        }
        else if (this.visited) {
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
