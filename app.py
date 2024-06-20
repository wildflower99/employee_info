from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:riku@DESKTOP-65BTT28/empinfo'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class LogEntry(db.Model):
    __tablename__ = 'log_entries'

    employee_id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    log_level = db.Column(db.String(20))
    message = db.Column(db.Text)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    intelgic_employee = db.Column(db.Boolean)
    department_id = db.Column(db.Integer, db.ForeignKey('department.department_id'))
    department = db.relationship('Department', back_populates='log_entries')

class Department(db.Model):
    __tablename__ = 'department'

    department_id = db.Column(db.Integer, primary_key=True)
    department_name = db.Column(db.String(100))
    location = db.Column(db.String(100))
    log_entries = db.relationship('LogEntry', back_populates='department')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/postdata', methods=['POST'])
def postdata():
    if request.method == 'POST':
        data = request.get_json()
        nameop = data.get("nameInput")
        emailop = data.get("emailInput")
        departmentop = data.get("departmentInput")
        locationop = data.get('locationInput')
        intelgic_employee = data.get("intelgic_employee")

        app.logger.info("%s %s %s %s %s", nameop, emailop, departmentop, locationop, intelgic_employee)

        # Insert log entry into the database
        log_entry = LogEntry(
            log_level="INFO",
            message=f"Submitted data: {nameop}, {emailop}, {departmentop}, {locationop}, {intelgic_employee}",
            name=nameop,
            email=emailop,
            intelgic_employee=intelgic_employee
        )

        # Insert department entry into the database or fetch if exists
        department = Department.query.filter_by(department_name=departmentop, location=locationop).first()
        if not department:
            department = Department(
                department_name=departmentop,
                location=locationop
            )

        # Establish the relationship between log_entry and department
        log_entry.department = department

        db.session.add(log_entry)
        db.session.commit()

        return jsonify({
            'message': "Submitted Successfully :)",
            'name': nameop,
            'email': emailop,
            'department': departmentop,
            'location': locationop,
            'intelgic_employee': intelgic_employee
        })
    else:
        return jsonify({'error': "Something went wrong"})

@app.route('/get_employee_data', methods=['GET'])
def get_employee_data():
    try:
        employee_list = []
        log_entries = LogEntry.query.all()

        for log_entry in log_entries:
            employee_data = {
                'name': log_entry.name,
                'email': log_entry.email,
                'department': log_entry.department.department_name if log_entry.department else None,
                'location': log_entry.department.location if log_entry.department else None,
                'intelgic_employee': log_entry.intelgic_employee
            }
            employee_list.append(employee_data)

        return jsonify(employee_list)

    except Exception as e:
        app.logger.error(f"Error occurred while fetching employee data: {str(e)}")
        return jsonify({'error': "Something went wrong"})

@app.route('/delete_employee', methods=['POST'])
def delete_employee():
    data = request.get_json()
    name = data['name']
    employee = LogEntry.query.filter_by(name=name).first()
    if employee:
        # Delete the associated department
        if employee.department:
            db.session.delete(employee.department)
        db.session.delete(employee)
        db.session.commit()
        return jsonify({'message': 'Employee deleted successfully'})
    else:
        return jsonify({'error': 'Employee not found'})

@app.route('/edit_employee', methods=['POST'])
def edit_employee():
    data = request.get_json()
    original_name = data['originalName']
    name = data['name']
    email = data['email']
    department_name = data['department']
    location = data['location']
    intelgic_employee = data.get('intelgic_employee', True)  # Get the checkbox value

    app.logger.info("Received data for editing: original_name=%s, name=%s, email=%s, department=%s, location=%s, intelgic_employee=%s",
                    original_name, name, email, department_name, location, intelgic_employee)
    
    # Find the employee to edit
    employee = LogEntry.query.filter_by(name=original_name).first()
    if employee:
        # Update employee data
        employee.name = name
        employee.email = email
        employee.intelgic_employee = intelgic_employee
        
        # Update or create department
        if department_name and location:
            department = Department.query.filter_by(department_name=department_name, location=location).first()
            if not department:
                department = Department(
                    department_name=department_name,
                    location=location
                )
            employee.department = department
        else:
            # If department details are not provided, remove existing department association
            if employee.department:
                db.session.delete(employee.department)
                employee.department = None
        
        db.session.commit()
        app.logger.info("Employee data updated successfully")
        return jsonify({'message': 'Employee data updated successfully', 'success': True}), 200
    else:
        app.logger.warning("No rows were updated. Check if the original name exists.")
        return jsonify({'message': 'No rows were updated. Check if the original name exists.', 'success': False}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    # Run the Flask application
    app.run(host='0.0.0.0', port=5000, debug=False)
