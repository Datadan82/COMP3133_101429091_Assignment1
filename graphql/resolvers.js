const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

module.exports = {
  Query: {
    // LOGIN
    login: async (_, { usernameOrEmail, password }) => {
      const user = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
      });
      if (!user) throw new Error('User not found');

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials');

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return { token, user };
    },

    // GET ALL EMPLOYEES
    getAllEmployees: async () => {
      return await Employee.find();
    },

    // SEARCH BY ID
    searchEmployeeById: async (_, { eid }) => {
      const employee = await Employee.findById(eid);
      if (!employee) throw new Error('Employee not found');
      return employee;
    },

    // SEARCH BY DESIGNATION OR DEPARTMENT
    searchEmployeeByDesignationOrDepartment: async (_, { designation, department }) => {
      if (!designation && !department) throw new Error('Please provide designation or department');
      const query = {};
      if (designation) query.designation = designation;
      if (department) query.department = department;
      return await Employee.find(query);
    },
  },

  Mutation: {
    // SIGNUP
    signup: async (_, { username, email, password }) => {
      const existing = await User.findOne({ $or: [{ username }, { email }] });
      if (existing) throw new Error('Username or email already exists');

      if (password.length < 6) throw new Error('Password must be at least 6 characters');

      const hashed = await bcrypt.hash(password, 12);
      const user = new User({ username, email, password: hashed });
      return await user.save();
    },

    // ADD EMPLOYEE
    addEmployee: async (_, args) => {
      if (args.salary < 1000) throw new Error('Salary must be at least 1000');
      const existing = await Employee.findOne({ email: args.email });
      if (existing) throw new Error('Employee email already exists');

      const employee = new Employee(args);
      return await employee.save();
    },

    // UPDATE EMPLOYEE
    updateEmployee: async (_, { eid, ...updates }) => {
      if (updates.salary && updates.salary < 1000) throw new Error('Salary must be at least 1000');
      const employee = await Employee.findByIdAndUpdate(eid, updates, { returnDocument: 'after' });
      if (!employee) throw new Error('Employee not found');
      return employee;
    },

    // DELETE EMPLOYEE
    deleteEmployee: async (_, { eid }) => {
      const employee = await Employee.findByIdAndDelete(eid);
      if (!employee) throw new Error('Employee not found');
      return `Employee ${eid} deleted successfully`;
    },

    // UPLOAD EMPLOYEE PHOTO
    uploadEmployeePhoto: async (_, { eid, photo_url }) => {
      const result = await cloudinary.uploader.upload(photo_url, {
        folder: 'employees',
        public_id: `employee_${eid}`,
      });

      const employee = await Employee.findByIdAndUpdate(
        eid,
        { employee_photo: result.secure_url },
        { returnDocument: 'after' }
      );
      if (!employee) throw new Error('Employee not found');
      return employee;
    },
  }
};