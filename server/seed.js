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
    const mech = branches[2];

    // ─── Students ───
    const studentsData = [
        {
            name: 'Rahul Sharma',
            email: 'rahul.sharma@gmail.com',
            phone: '9876543210',
            rollNo: 'CSE001',
            admissionNo: 'ADM2024001',
            branch: cse._id,
            semester: 4,
            academicYear: '2024/2025',
            className: 'UG',
            section: 'A',
            gender: 'Male',
            dob: '2003-05-15',
            category: 'General',
            password: 'rahul@CSE001',
            // Parent
            fatherName: 'Rajesh Sharma',
            fatherPhone: '9812345600',
            fatherOccupation: 'Business',
            motherName: 'Sunita Sharma',
            motherPhone: '9812345601',
            motherOccupation: 'Homemaker',
            guardianType: 'Father',
            guardianName: 'Rajesh Sharma',
            guardianPhone: '9812345600',
            guardianEmail: 'rajesh.sharma@gmail.com',
            guardianOccupation: 'Business',
            guardianAddress: '12 MG Road, Jaipur, Rajasthan 302001',
            // Medical
            bloodGroup: 'B+',
            height: '175',
            weight: '68',
            // Bank
            bankAccountNo: '1234567890123',
            bankName: 'State Bank of India',
            ifscCode: 'SBIN0001234',
            nationalId: 'XXXXXXXX1234',
            // School
            prevSchoolName: 'Delhi Public School, Jaipur',
            prevSchoolAddress: 'Tonk Road, Jaipur, Rajasthan',
            // Address
            currentAddress: 'Room 101, Boys Hostel, College Campus, Jaipur',
            permanentAddress: '12 MG Road, Jaipur, Rajasthan 302001',
            // Hostel
            hostelName: 'Vivekananda Hostel',
            roomNo: '101',
            // Docs
            docName: 'Aadhar Card',
            studentDetails: 'Merit scholarship student. Active in coding club.',
        },
        {
            name: 'Priya Singh',
            email: 'priya.singh@gmail.com',
            phone: '9876543211',
            rollNo: 'CSE002',
            admissionNo: 'ADM2024002',
            branch: cse._id,
            semester: 4,
            academicYear: '2024/2025',
            className: 'UG',
            section: 'A',
            gender: 'Female',
            dob: '2003-08-22',
            category: 'OBC',
            password: 'priya@CSE002',
            // Parent
            fatherName: 'Vikram Singh',
            fatherPhone: '9823456710',
            fatherOccupation: 'Government Employee',
            motherName: 'Anjali Singh',
            motherPhone: '9823456711',
            motherOccupation: 'Teacher',
            guardianType: 'Father',
            guardianName: 'Vikram Singh',
            guardianPhone: '9823456710',
            guardianEmail: 'vikram.singh@gmail.com',
            guardianOccupation: 'Government Employee',
            guardianAddress: '45 Sector 7, Chandigarh 160007',
            // Medical
            bloodGroup: 'O+',
            height: '162',
            weight: '54',
            // Bank
            bankAccountNo: '9876543210123',
            bankName: 'Punjab National Bank',
            ifscCode: 'PUNB0001234',
            nationalId: 'YYYYYYYY5678',
            // School
            prevSchoolName: 'Kendriya Vidyalaya, Chandigarh',
            prevSchoolAddress: 'Sector 35, Chandigarh',
            // Address
            currentAddress: 'Room 205, Girls Hostel, College Campus, Jaipur',
            permanentAddress: '45 Sector 7, Chandigarh 160007',
            // Hostel
            hostelName: 'Saraswati Hostel',
            roomNo: '205',
            // Docs
            docName: 'Aadhar Card',
            studentDetails: 'Class representative. Interested in AI/ML.',
        },
        {
            name: 'Amit Kumar',
            email: 'amit.kumar@gmail.com',
            phone: '9876543212',
            rollNo: 'ECE001',
            admissionNo: 'ADM2024003',
            branch: ece._id,
            semester: 3,
            academicYear: '2024/2025',
            className: 'UG',
            section: 'B',
            gender: 'Male',
            dob: '2004-01-10',
            category: 'SC',
            password: 'amit@ECE001',
            // Parent
            fatherName: 'Suresh Kumar',
            fatherPhone: '9834567820',
            fatherOccupation: 'Farmer',
            motherName: 'Meena Kumar',
            motherPhone: '9834567821',
            motherOccupation: 'Homemaker',
            guardianType: 'Father',
            guardianName: 'Suresh Kumar',
            guardianPhone: '9834567820',
            guardianEmail: 'suresh.kumar@gmail.com',
            guardianOccupation: 'Farmer',
            guardianAddress: 'Village Rampur, District Agra, UP 282001',
            // Medical
            bloodGroup: 'A+',
            height: '170',
            weight: '62',
            // Bank
            bankAccountNo: '1122334455667',
            bankName: 'Bank of Baroda',
            ifscCode: 'BARB0001234',
            nationalId: 'ZZZZZZZZ9012',
            // School
            prevSchoolName: 'Agra Public School',
            prevSchoolAddress: 'Civil Lines, Agra, UP',
            // Address
            currentAddress: 'Room 312, Boys Hostel, College Campus',
            permanentAddress: 'Village Rampur, District Agra, UP 282001',
            // Hostel
            hostelName: 'Vivekananda Hostel',
            roomNo: '312',
            // Docs
            docName: 'Aadhar Card',
            studentDetails: 'SC category scholarship. Good in practical subjects.',
        },
        {
            name: 'Neha Verma',
            email: 'neha.verma@gmail.com',
            phone: '9876543213',
            rollNo: 'MECH001',
            admissionNo: 'ADM2024004',
            branch: mech._id,
            semester: 2,
            academicYear: '2024/2025',
            className: 'UG',
            section: 'C',
            gender: 'Female',
            dob: '2004-03-18',
            category: 'General',
            password: 'neha@MECH001',
            // Parent
            fatherName: 'Deepak Verma',
            fatherPhone: '9845678930',
            fatherOccupation: 'Engineer',
            motherName: 'Kavita Verma',
            motherPhone: '9845678931',
            motherOccupation: 'Doctor',
            guardianType: 'Mother',
            guardianName: 'Kavita Verma',
            guardianPhone: '9845678931',
            guardianEmail: 'kavita.verma@gmail.com',
            guardianOccupation: 'Doctor',
            guardianAddress: '78 Park Street, Kolkata 700016',
            // Medical
            bloodGroup: 'AB+',
            height: '158',
            weight: '52',
            // Bank
            bankAccountNo: '3344556677889',
            bankName: 'HDFC Bank',
            ifscCode: 'HDFC0001234',
            nationalId: 'AAAAAAAA3456',
            // School
            prevSchoolName: 'St. Xavier\'s School, Kolkata',
            prevSchoolAddress: 'Park Street, Kolkata 700016',
            // Address
            currentAddress: 'Room 108, Girls Hostel, College Campus',
            permanentAddress: '78 Park Street, Kolkata 700016',
            // Hostel
            hostelName: 'Saraswati Hostel',
            roomNo: '108',
            // Docs
            docName: 'Aadhar Card',
            studentDetails: 'One of few female students in Mechanical. Excellent academic record.',
        },
    ];

    for (const s of studentsData) {
        const user = await User.create({ name: s.name, loginId: s.email, password: s.password, role: 'student' });
        const student = await Student.create({
            name: s.name, email: s.email, phone: s.phone,
            rollNo: s.rollNo, admissionNo: s.admissionNo,
            branch: s.branch, semester: s.semester,
            academicYear: s.academicYear, className: s.className, section: s.section,
            gender: s.gender, dob: s.dob, category: s.category,
            fatherName: s.fatherName, fatherPhone: s.fatherPhone, fatherOccupation: s.fatherOccupation,
            motherName: s.motherName, motherPhone: s.motherPhone, motherOccupation: s.motherOccupation,
            guardianType: s.guardianType, guardianName: s.guardianName, guardianEmail: s.guardianEmail,
            guardianPhone: s.guardianPhone, guardianOccupation: s.guardianOccupation, guardianAddress: s.guardianAddress,
            bloodGroup: s.bloodGroup, height: s.height, weight: s.weight,
            bankAccountNo: s.bankAccountNo, bankName: s.bankName, ifscCode: s.ifscCode, nationalId: s.nationalId,
            prevSchoolName: s.prevSchoolName, prevSchoolAddress: s.prevSchoolAddress,
            currentAddress: s.currentAddress, permanentAddress: s.permanentAddress,
            hostelName: s.hostelName, roomNo: s.roomNo,
            docName: s.docName, studentDetails: s.studentDetails,
            userId: user._id
        });
        user.refId = student._id;
        await user.save();
        const branchData = branches.find(b => b._id.equals(s.branch));
        await Fee.create({
            student: student._id, branch: s.branch,
            totalAmount: branchData.feeStructure.totalFee,
            paidAmount: Math.round(branchData.feeStructure.totalFee * 0.6),
            payments: [
                { amount: Math.round(branchData.feeStructure.totalFee * 0.4), method: 'Online', date: new Date('2024-07-10') },
                { amount: Math.round(branchData.feeStructure.totalFee * 0.2), method: 'Bank Transfer', date: new Date('2024-11-05') },
            ]
        });
        console.log(`✅ Student: ${s.name} — ${s.email} / ${s.password}`);
    }

    // ─── Teacher ───
    const tUser = await User.create({ name: 'Dr. Suresh Patel', loginId: 'suresh.patel@gmail.com', password: 'suresh@EMP001', role: 'teacher' });
    const teacher = await Teacher.create({
        name: 'Dr. Suresh Patel', email: 'suresh.patel@gmail.com',
        phone: '9876500001', employeeId: 'EMP001', branch: cse._id,
        subjects: ['Data Structures', 'Algorithms'],
        className: 'CS-4A',
        qualification: 'PhD in Computer Science', experience: '10 Years', salary: 75000,
        joiningDate: new Date('2018-07-15'), contractType: 'Permanent', shift: 'Morning Shift', workLocation: 'Main Campus, Building B',
        teacherDetails: 'Specializes in Advanced Algorithms. Head of the Programming Club.',
        gender: 'Male', dob: new Date('1982-04-12'), fatherName: 'Ramesh Patel', motherName: 'Kamala Patel', maritalStatus: 'Married',
        bloodGroup: 'B+', height: '175', weight: '70',
        bankAccountNo: '987654321000', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', nationalId: 'IND987654321',
        docName: 'Aadhar & PAN', prevSchoolName: 'XYZ Institute of Technology', prevSchoolAddress: 'MG Road, Bangalore',
        currentAddress: 'A-45, Staff Quarters, College Campus', permanentAddress: '15 Gandhi Marg, Ahmedabad', address: 'A-45, Staff Quarters, College Campus',
        facebook: 'suresh.patel', linkedin: 'in/suresh-patel-cs', instagram: 'suresh_codes', youtube: 'CSwithSuresh',
        userId: tUser._id
    });
    tUser.refId = teacher._id;
    await tUser.save();
    console.log('✅ Teacher: Dr. Suresh Patel — suresh.patel@gmail.com / suresh@EMP001');

    console.log('\n🎉 Seeding complete!\n');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║               LOGIN CREDENTIALS                      ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║ ADMIN   admin@gmail.com              / admin123      ║');
    console.log('║ STUDENT rahul.sharma@gmail.com       / rahul@CSE001  ║');
    console.log('║ STUDENT priya.singh@gmail.com        / priya@CSE002  ║');
    console.log('║ STUDENT amit.kumar@gmail.com         / amit@ECE001   ║');
    console.log('║ STUDENT neha.verma@gmail.com         / neha@MECH001  ║');
    console.log('║ TEACHER suresh.patel@gmail.com       / suresh@EMP001 ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
