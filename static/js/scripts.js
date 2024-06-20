    $(document).ready(function() {
    var dropbtn = $('.dropbtn');
    var dropdownContent = $('.dropdown-content');

    dropbtn.on('click', function() {
        dropdownContent.toggleClass('show');
    });

    // Close the dropdown menu if the user clicks outside of it
    $(window).on('click', function(event) {
        if (!$(event.target).is('.dropbtn')) {
            if (dropdownContent.hasClass('show')) {
                dropdownContent.removeClass('show');
            }
        }
    });
    
    // Function to load employee data from the server
        $.ajax({
            url: '/get_employee_data',
            type: 'GET',
            success: function(response) {
                var table = $('#outputTable');
              
                response.forEach(function(employee) {
                    var row = $('<tr></tr>');
                    var nameCell = $('<td></td>').text(employee.name);
                    var emailCell = $('<td></td>').text(employee.email);
                    var departmentCell = $('<td></td>').text(employee.department); // Adjusted to use department_name
                    var locationCell = $('<td></td>').text(employee.location);
                    var employeeCell = $('<td></td>').text(employee.intelgic_employee ? 'Yes' : 'No');

                    var actionCell = $('<td></td>').html('<button onclick="editData(this)">Edit</button><button onclick="deleteRow(this)">Delete</button>');
                    row.append(nameCell, emailCell, departmentCell, locationCell, employeeCell, actionCell);
                    table.append(row);
                });
            },
            error: function() {
                alert('Failed to fetch employee data');
            }
        });
    });

    // Function to set the department input value
    function setDepartment(department) {
        $('#departmentInput').val(department);
        $('.dropdown-content').removeClass('show');
    }

    // Function to set the location input value
    function setLocation(location) {
        $('#locationInput').val(location);
        $('.dropdown-content').removeClass('show');
    }

    // Function to add data to the table
    function addData() {
        var name = $('#nameInput').val();
        var email = $('#emailInput').val();
        var department = $('#departmentInput').val();
        var location = $('#locationInput').val();
        var intelgic_employee = $('#intelgic_employee').prop('checked');

        if (name === '' || email === '' || department === '' || location === '') {
            alert('Please fill all the fields');
            return;
        }

        // Check if the name already exists in the table
        var nameExists = false;
        $('#outputTable tr').each(function() {
            if ($(this).find('td:eq(0)').text() === name) {
                nameExists = true;
                return false; // exit the loop
            }
        });

        if (nameExists) {
            alert('Name already exists in the table');
            return;
        }

        var table = $('#outputTable');
        var row = $('<tr></tr>');
        var nameCell = $('<td></td>').text(name);
        var emailCell = $('<td></td>').text(email);
        var departmentCell = $('<td></td>').text(department);
        var locationCell = $('<td></td>').text(location);
        var employeeCell = $('<td></td>').text(intelgic_employee ? 'Yes' : 'No');
        var actionCell = $('<td></td>').html('<button onclick="editData(this)">Edit</button><button onclick="deleteRow(this)">Delete</button>');

        row.append(nameCell, emailCell, departmentCell, locationCell, employeeCell, actionCell);
        table.append(row);

        // AJAX call to add data
        $.ajax({
            url: '/postdata',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                nameInput: name,
                emailInput: email,
                departmentInput: department,
                locationInput: location,
                intelgic_employee: intelgic_employee
            }),
            success: function(response) {
                alert(response.message);
                // Clear input fields
                $('#nameInput').val('');
                $('#emailInput').val('');
                $('#departmentInput').val('');
                $('#locationInput').val('');
                $('#intelgic_employee').prop('checked', true);

             
            },
            error: function() {
                alert('Something went wrong');
            }
        });
    }

    // Function to delete a row
    function deleteRow(button) {
        var row = $(button).closest('tr');
        var name = row.find('td:eq(0)').text();

        // AJAX call to delete data
        $.ajax({
            url: '/delete_employee',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name: name }),
            success: function(response) {
                alert(response.message);
                // Remove the row from the table after successful delete
                row.remove();
            },
            error: function() {
                alert('Failed to delete employee');
            }
        });
    }

    // Function to edit a row
    function editData(button) {
        // Get the parent row of the clicked button
        let row = $(button).closest("tr");

        // Get the cells within the row
        let nameCell = row.find("td:eq(0)");
        let emailCell = row.find("td:eq(1)");
        let departmentCell = row.find("td:eq(2)");
        let locationCell = row.find("td:eq(3)");
        let employeeCell = row.find("td:eq(4)");

        // Store original name to use later
        let originalName = nameCell.text();

        // Convert cells into editable input fields
        let nameInput = $('<input>').attr('type', 'text').val(nameCell.text());
        let emailInput = $('<input>').attr('type', 'text').val(emailCell.text());

        // Create dropdown for department
        let departmentInput = $('<select></select>')
            .append('<option value="Manager">Manager</option>')
            .append('<option value="Account">Account</option>')
            .append('<option value="Human Resources">Human Resources</option>')
            .val(departmentCell.text());

        // Create dropdown for location
        let locationInput = $('<select></select>')
            .append('<option value="Kolkata">Kolkata</option>')
            .append('<option value="Mumbai">Mumbai</option>')
            .append('<option value="Bangaluru">Bangaluru</option>')
            .val(locationCell.text());

        // Create checkbox for Intelgic Employee
        let intelgic_employee = $('<input>').attr('type', 'checkbox').prop('checked', employeeCell.text() === 'Yes');

        // Replace cell contents with input fields
        nameCell.empty().append(nameInput);
        emailCell.empty().append(emailInput);
        departmentCell.empty().append(departmentInput);
        locationCell.empty().append(locationInput);
        employeeCell.empty().append(intelgic_employee);

        // Replace "Edit" button with "Save" button
        $(button).replaceWith('<button onclick="saveData(this)" data-original-name="' + originalName + '">Save</button>');
    }

    // Function to save edited data
    function saveData(button) {
        // Get the parent row of the clicked button
        let row = $(button).closest("tr");

        // Get the input fields within the row
        let nameInput = row.find("td:eq(0) input").val();
        let emailInput = row.find("td:eq(1) input").val();
        let departmentInput = row.find("td:eq(2) select").val();
        let locationInput = row.find("td:eq(3) select").val();
        let intelgic_employee = row.find("td:eq(4) input").is(':checked');

        // Get the original name from the data attribute
        let originalName = $(button).data('original-name');

        // AJAX call for edit
        $.ajax({
            url: '/edit_employee',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                originalName: originalName,
                name: nameInput,
                email: emailInput,
                department: departmentInput,
                location: locationInput,
                intelgic_employee: intelgic_employee
            }),
            success: function(response) {
                alert(response.message);
                if (response.success) {
                    // Update the cell contents with the new values
                    row.find("td:eq(0)").text(nameInput);
                    row.find("td:eq(1)").text(emailInput);
                    row.find("td:eq(2)").text(departmentInput);
                    row.find("td:eq(3)").text(locationInput);
                    row.find("td:eq(4)").text(intelgic_employee ? 'Yes' : 'No');

             // Replace "Save" button with "Edit" and "Delete" buttons
             row.find("td:last").html('<button onclick="editData(this)">Edit</button><button onclick="deleteRow(this)">Delete</button>');
            }
        },
        error: function() {
            alert('Failed to edit employee data');
        }
    });
}
