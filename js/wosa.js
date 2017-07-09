// Basic operational variables

var data_array = []; // array that will hold json data
var cell_title_array = []; // array that will hold the table cell titles
var working_cell_title_array = []; // array of table cell titles that will change based on user input
var working_array = []; // array of table cell data that will change based on user input
var total_col_count; // total number of columns in working array
var last_modified; // when the data was last modified
var individuals_affected = 0; // total number of individuals affected

/*  

Array indexes of columns in data:

0 - Name of Covered Entity
1 - State
2 - Covered Entity Type
3 - Individuals Affected
4 - Breach Submission Date
5 - Type of Breach
6 - Location of Breached Information
7 - Business Associate Present
8 - Web Description
9 - Datestamp created in script but not included in data file

*/

// Pull json data and populate data_array

var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        var parsed_data = JSON.parse(xhr.responseText);
        cell_title_array = Object.keys(parsed_data[0]);

        var earliest_sofar = 0;
        var latest_sofar = 0;

        for (var i = 0; i < parsed_data.length; i += 1) {
            var j_var = [];

            for (var j = 0; j < 1; j += 1) {
                j_var.push(parsed_data[i]["Name of Covered Entity"]);

                var state_field_name = parsed_data[i]["State"];
                if (state_field_name.length > 0) {
                    // if the state is indicated in the data
                    j_var.push(parsed_data[i]["State"]);
                } else {
                    // if the state field is blank and is not indicated in the data
                    j_var.push("zz"); // zz is a placeholder so that these rows are put at the end of the table for appearance sake
                }

                j_var.push(parsed_data[i]["Covered Entity Type"]);

                j_var.push(parsed_data[i]["Individuals Affected"]);
                var individuals_affected_field_name = Number(
                    parsed_data[i]["Individuals Affected"]
                ); // change individuals affected field to numeric data
                individuals_affected += individuals_affected_field_name; // add current data from individuals affected field to the running total of individuals affected

                // code below is to put the total number of individuals affected into comma separated format to make it more readable

                var individuals_affected_to_string = individuals_affected.toString(); // temporary variable of the numeric value as a string so it can be split into an array
                var individuals_affected_string_array = individuals_affected_to_string.split(
                    ""
                ); // split the string into an array of individual characters
                individuals_affected_string_array.reverse(); // reverse the string array so that it can be looped through backwards to determine where the commas will be placed

                for (var k = 0; k < individuals_affected_string_array.length; k += 1) {
                    // loop through the string array and place the commas in numbers 1000 or greater
                    if (k % 4 === 0 && individuals_affected_string_array.length > 3) {
                        individuals_affected_string_array.splice(k, 0, ",");
                    }
                }

                var length_after_commas = individuals_affected_string_array.length; // get the new array length after commas have been inserted
                var last_item = individuals_affected_string_array.length - 1; // get the array index of the last item so it can be tested to see if it is a stray comma and if it is to delete it
                individuals_affected_string_array.reverse(); // reverse the string again to put it back into its correct order
                if (individuals_affected_string_array[last_item] === ",") {
                    individuals_affected_string_array.pop();
                } // if last index is a comma delete it so there is not a stray comma stuck at the end of the number
                var individuals_affected_joined_string = individuals_affected_string_array.join(
                    ""
                ); // turn the string array back into a string that will hold the running total of the individuals affected

                j_var.push(parsed_data[i]["Breach Submission Date"]);

                var typeof_breach_field_name = parsed_data[i]["Type of Breach"];
                if (typeof_breach_field_name.length > 3) {
                    j_var.push(parsed_data[i]["Type of Breach"]);
                } else {
                    j_var.push("Unknown");
                }

                j_var.push(parsed_data[i]["Location of Breached Information"]);
                j_var.push(parsed_data[i]["Business Associate Present"]);





                var web_description_field_name = parsed_data[i]["Web Description"];
                if (web_description_field_name.length > 3) {
                    j_var.push(parsed_data[i]["Web Description"]);
                } else {
                    j_var.push("No further information available.");
                }

                // code below is for creating the datestamp field so that rows can be ordered by date

                var date_parts = parsed_data[i]["Breach Submission Date"].split("/"); // turn date into an array of its numbers
                var ordered_dates = Number(
                    date_parts[2] + date_parts[0] + date_parts[1]
                ); // create a string using the date_parts array numbers and order by year month and day
                j_var.push(ordered_dates); // add a new column containing the new date string

                // code below is for getting the earliest breach date

                if (i === 0) {
                    earliest_sofar = ordered_dates;
                } else {
                    if (ordered_dates < earliest_sofar) {
                        earliest_sofar = ordered_dates;
                    }
                }

                // code below is for getting the latest breach date to populate the breaking news div

                if (i === 0) {
                    latest_sofar = ordered_dates;
                } else {
                    if (ordered_dates > latest_sofar) {
                        latest_sofar = ordered_dates;
                        var latest_breach_string =
                            parsed_data[i]["Type of Breach"] +
                            " at " +
                            parsed_data[i]["Name of Covered Entity"] +
                            " affects " +
                            parsed_data[i]["Individuals Affected"] +
                            " people. Read more... ";
                    }
                }
            } // end for j
            data_array.push(j_var);
        } // end for i
        last_modified = xhr.getResponseHeader("Last-Modified");
    } // end if
    total_col_count = data_array[0].length;

    // Set variables for earliest year output
    var earliest_date_string = earliest_sofar.toString();
    var earliest_date_string_array = earliest_date_string.split("");
    var earliest_year_string_array = earliest_date_string_array.slice(0, 4);
    var earliest_year = earliest_year_string_array.join("");

    // Output default info to jumbotron
    document.getElementById("description_jumbotron").innerHTML =
        "This page shows a comprehensive list of security breaches of unsecured protected health information affecting 500 or more individuals since " +
        earliest_year +
        ". ";

    // Output latest breach to breaking news div
    document.getElementById("breaking_news").innerHTML =
        "Latest news: " + latest_breach_string;
}; // end loading json data function

xhr.open("GET", "data/wosa.json");
xhr.send();



// Sort results and output them to table

function loadTable(sortcol) {
    working_array = []; // reset working_array to empty
    working_cell_title_array = []; // reset working_cell_title_array to empty
    var sort_by = sortcol; // parameter passed through function call telling which column to sort by
    for (var i = 0; i < data_array.length; i += 1) {
        // loop through array created by ajax call
        var j_var = [];
        for (var j = 0; j <= total_col_count; j += 1) {
            // loop through the columns in each row



            if (j === sort_by) {
                // if current column is the one to sort by
                j_var.unshift(data_array[i][j]);
            } else {
                j_var.push(data_array[i][j]);
            }
        } // end for j
        working_array.push(j_var);
    } // end for i
    working_array.sort();

    if (sort_by === 9) {
        working_array.reverse();
    }

    for (var k = 0; k < cell_title_array.length - 1; k += 1) { // loop through cell title array
        if (k === sort_by) { // if current column is the one to sort by
            working_cell_title_array.unshift(cell_title_array[k]);
        } else {
            working_cell_title_array.push(cell_title_array[k]);
        }
    }

    var tableHTML = '<table class="table table-hover"><thead><tr>';
    var tableHTML = '<table class="table table-hover table-bordered"><thead><tr>';

    for (var i = 0; i < cell_title_array.length - 1; i += 1) { // Populate table headers
        tableHTML += "<th>" + working_cell_title_array[i] + "</th>";
    }

    tableHTML += "</tr></thead><tbody>";

    for (var i = 0; i < working_array.length; i += 1) {
        // Populate default table body
        tableHTML += "<tr>";
        for (var j = 0; j < 9; j += 1) {

            if (sort_by === 9) { // if sorting by date stamp
                if (j > 0) { // excludes the time stamp from the table
                    tableHTML += "<td>";
                    if (working_array[i][j] === "zz") { // if value in cell is zz so it can be put at the end
                        tableHTML += "?"; // substitute a question mark for the zz so it makes more sense
                    } else {
                        tableHTML += working_array[i][j];
                    } // end if value in cell is zz so it can be put at the end
                    tableHTML += "</td>";
                }
            } else {
                if (j < 8) { // 
                    tableHTML += "<td>";
                    if (working_array[i][j] === "zz") { // if value in cell is zz so it can be put at the end
                        tableHTML += "?"; // substitute a question mark for the zz so it makes more sense
                    } else {
                        tableHTML += working_array[i][j];
                    } // end if value in cell is zz so it can be put at the end
                    tableHTML += "</td>";
                }
            }
        } // end for j
        tableHTML += "</tr>";
    }
    tableHTML += "</tbody></table>";

    document.getElementById("infoDiv").innerHTML = tableHTML;
    document.getElementById("infoDiv").style.height = "20em";
    document.getElementById("infoDiv").style.overflowY = "scroll";
    document.getElementById("description_jumbotron").style.display = "none";
} // end load table function