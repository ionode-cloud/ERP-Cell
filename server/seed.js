require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Branch = require('./models/Branch');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Fee = require('./models/Fee');

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Fee.deleteMany({});

    // ─── Admin ───
    await User.create({ name: 'Admin', loginId: 'admin@gmail.com', password: 'admin123', role: 'admin' });
    console.log('✅ Admin created');

    // ─── Branches ───
    const branches = await Branch.insertMany([
        {
            name: 'Computer Science Engineering', code: 'CSE', description: 'CS & IT',
            duration: '4 Years', totalSeats: 60,
            feeStructure: { totalFee: 80000, tuitionFee: 50000, examFee: 10000, labFee: 15000, otherFee: 5000 },
            subjects: ['Data Structures', 'Algorithms', 'DBMS', 'OS', 'Computer Networks', 'Web Development', 'Machine Learning']
        },
        {
            name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Electronics & Comm',
            duration: '4 Years', totalSeats: 60,
            feeStructure: { totalFee: 75000, tuitionFee: 45000, examFee: 10000, labFee: 15000, otherFee: 5000 },
            subjects: ['Circuit Theory', 'Signals & Systems', 'Digital Electronics', 'Microprocessors', 'Communication Systems']
        },
        {
            name: 'Mechanical Engineering', code: 'MECH', description: 'Mechanical',
            duration: '4 Years', totalSeats: 60,
            feeStructure: { totalFee: 70000, tuitionFee: 42000, examFee: 10000, labFee: 13000, otherFee: 5000 },
            subjects: ['Engineering Mechanics', 'Thermodynamics', 'Fluid Mechanics', 'Manufacturing', 'CAD/CAM']
        },
        {
            name: 'Civil Engineering', code: 'CIVIL', description: 'Civil & Structural',
            duration: '4 Years', totalSeats: 60,
            feeStructure: { totalFee: 68000, tuitionFee: 40000, examFee: 10000, labFee: 12000, otherFee: 6000 },
            subjects: ['Structural Analysis', 'Surveying', 'Concrete Technology', 'Geotechnical Engineering', 'Environmental Engg']
        }
    ]);
    console.log(`✅ ${branches.length} branches created`);

    const cse = branches[0];
    const ece = branches[1];

    // ─── Students (email = loginId, password = firstname@rollNo) ───
    const studentsData = [
        { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '9876543210', rollNo: 'CSE001', branch: cse._id, semester: 4, gender: 'Male', password: 'rahul@CSE001' },
        { name: 'Priya Singh', email: 'priya.singh@gmail.com', phone: '9876543211', rollNo: 'CSE002', branch: cse._id, semester: 4, gender: 'Female', password: 'priya@CSE002' },
        { name: 'Amit Kumar', email: 'amit.kumar@gmail.com', phone: '9876543212', rollNo: 'ECE001', branch: ece._id, semester: 3, gender: 'Male', password: 'amit@ECE001' },
    ];

    for (const s of studentsData) {
        const user = await User.create({ name: s.name, loginId: s.email, password: s.password, role: 'student' });
        const student = await Student.create({
            name: s.name, email: s.email, phone: s.phone,
            rollNo: s.rollNo, branch: s.branch, semester: s.semester,
            gender: s.gender, userId: user._id
        });
        user.refId = student._id;
        await user.save();
        const branchData = branches.find(b => b._id.equals(s.branch));
        await Fee.create({
            student: student._id, branch: s.branch,
            totalAmount: branchData.feeStructure.totalFee,
            paidAmount: Math.round(branchData.feeStructure.totalFee / 2),
            payments: [{ amount: Math.round(branchData.feeStructure.totalFee / 2), method: 'Online', date: new Date() }]
        });
        console.log(`✅ Student: ${s.name} — loginId: ${s.email} / ${s.password}`);
    }

    // ─── Teacher (email = loginId, password = firstname@employeeId) ───
    const tUser = await User.create({ name: 'Dr. Suresh Patel', loginId: 'suresh.patel@gmail.com', password: 'suresh@EMP001', role: 'teacher' });
    const teacher = await Teacher.create({
        name: 'Dr. Suresh Patel', email: 'suresh.patel@gmail.com',
        phone: '9876500001', employeeId: 'EMP001', branch: cse._id,
        subjects: ['Data Structures', 'Algorithms'],
        qualification: 'PhD CS', experience: 10, salary: 75000, userId: tUser._id
    });
    tUser.refId = teacher._id;
    await tUser.save();
    console.log('✅ Teacher: Dr. Suresh Patel — loginId: suresh.patel@gmail.com / suresh@EMP001');

    console.log('\n🎉 Seeding complete!\n');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║              LOGIN CREDENTIALS                   ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║ ADMIN   admin@gmail.com         / admin123       ║');
    console.log('║ STUDENT rahul.sharma@gmail.com  / rahul@CSE001   ║');
    console.log('║ STUDENT priya.singh@gmail.com   / priya@CSE002   ║');
    console.log('║ STUDENT amit.kumar@gmail.com    / amit@ECE001    ║');
    console.log('║ TEACHER suresh.patel@gmail.com  / suresh@EMP001  ║');
    console.log('╚══════════════════════════════════════════════════╝');

    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
