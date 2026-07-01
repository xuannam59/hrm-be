import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  AttendanceStatus,
  EmployeeStatus,
  InsuranceType,
  LeaveStatus,
  PrismaClient,
  UserStatus,
} from '../generated/prisma/client';

const DEFAULT_PASSWORD = '12345678!';

const date = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

const hashPassword = async (plain: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

async function clearDatabase(prisma: PrismaClient) {
  await prisma.employeeBenefit.deleteMany();
  await prisma.insurance.deleteMany();
  await prisma.bonus.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employmentHistory.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.updateMany({ data: { managerId: null } });
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.role.deleteMany();
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });

  try {
    await clearDatabase(prisma);

    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    const [adminRole, hrRole, managerRole, employeeRole] = await Promise.all([
      prisma.role.create({
        data: { name: 'ADMIN', description: 'Quản trị hệ thống' },
      }),
      prisma.role.create({
        data: { name: 'HR', description: 'Nhân sự' },
      }),
      prisma.role.create({
        data: { name: 'MANAGER', description: 'Quản lý phòng ban' },
      }),
      prisma.role.create({
        data: { name: 'EMPLOYEE', description: 'Nhân viên' },
      }),
    ]);

    const [jsSkill, tsSkill, nestSkill, reactSkill, sqlSkill] =
      await Promise.all([
        prisma.skill.create({
          data: { name: 'JavaScript', description: 'Ngôn ngữ lập trình web' },
        }),
        prisma.skill.create({
          data: { name: 'TypeScript', description: 'JavaScript có kiểu tĩnh' },
        }),
        prisma.skill.create({
          data: { name: 'NestJS', description: 'Framework backend Node.js' },
        }),
        prisma.skill.create({
          data: { name: 'React', description: 'Thư viện UI frontend' },
        }),
        prisma.skill.create({
          data: { name: 'SQL', description: 'Truy vấn cơ sở dữ liệu' },
        }),
      ]);

    const [annualLeave, sickLeave, unpaidLeave] = await Promise.all([
      prisma.leaveType.create({
        data: { name: 'Nghỉ phép năm', paid: true, maxDays: 12 },
      }),
      prisma.leaveType.create({
        data: { name: 'Nghỉ ốm', paid: true, maxDays: 30 },
      }),
      prisma.leaveType.create({
        data: { name: 'Nghỉ không lương', paid: false, maxDays: 90 },
      }),
    ]);

    const [healthInsurance, lunchAllowance, gymMembership] = await Promise.all([
      prisma.benefit.create({
        data: {
          name: 'Bảo hiểm sức khỏe bổ sung',
          description: 'Gói bảo hiểm sức khỏe cho nhân viên',
        },
      }),
      prisma.benefit.create({
        data: {
          name: 'Phụ cấp ăn trưa',
          description: 'Hỗ trợ chi phí ăn trưa hàng ngày',
        },
      }),
      prisma.benefit.create({
        data: {
          name: 'Thẻ tập gym',
          description: 'Hội viên phòng gym đối tác',
        },
      }),
    ]);

    const [hrDept, techDept, salesDept, financeDept] = await Promise.all([
      prisma.department.create({
        data: {
          name: 'Phòng Nhân sự',
          description: 'Quản lý tuyển dụng và chính sách nhân sự',
        },
      }),
      prisma.department.create({
        data: {
          name: 'Phòng Kỹ thuật',
          description: 'Phát triển sản phẩm và hạ tầng kỹ thuật',
        },
      }),
      prisma.department.create({
        data: {
          name: 'Phòng Kinh doanh',
          description: 'Phát triển khách hàng và doanh thu',
        },
      }),
      prisma.department.create({
        data: {
          name: 'Phòng Tài chính',
          description: 'Kế toán, lương và báo cáo tài chính',
        },
      }),
    ]);

    const hrManager = await prisma.employee.create({
      data: {
        employeeCode: 'EMP001',
        firstName: 'Văn',
        lastName: 'Nguyễn',
        gender: 'Nam',
        birthday: date(1985, 3, 15),
        phone: '0901234567',
        email: 'nguyen.van.an@company.com',
        address: 'Hà Nội',
        hireDate: date(2018, 1, 10),
        position: 'Trưởng phòng Nhân sự',
        status: EmployeeStatus.WORKING,
        departmentId: hrDept.id,
      },
    });

    const hrStaff = await prisma.employee.create({
      data: {
        employeeCode: 'EMP002',
        firstName: 'Thị',
        lastName: 'Trần',
        gender: 'Nữ',
        birthday: date(1992, 7, 22),
        phone: '0902345678',
        email: 'tran.thi.binh@company.com',
        address: 'Hà Nội',
        hireDate: date(2020, 5, 1),
        position: 'Chuyên viên Nhân sự',
        status: EmployeeStatus.WORKING,
        departmentId: hrDept.id,
      },
    });

    const techLead = await prisma.employee.create({
      data: {
        employeeCode: 'EMP003',
        firstName: 'Minh',
        lastName: 'Lê',
        gender: 'Nam',
        birthday: date(1988, 11, 5),
        phone: '0903456789',
        email: 'le.minh.cuong@company.com',
        address: 'TP. Hồ Chí Minh',
        hireDate: date(2017, 8, 20),
        position: 'Trưởng phòng Kỹ thuật',
        status: EmployeeStatus.WORKING,
        departmentId: techDept.id,
      },
    });

    const seniorDev = await prisma.employee.create({
      data: {
        employeeCode: 'EMP004',
        firstName: 'Thu',
        lastName: 'Phạm',
        gender: 'Nữ',
        birthday: date(1994, 2, 18),
        phone: '0904567890',
        email: 'pham.thu.dung@company.com',
        address: 'TP. Hồ Chí Minh',
        hireDate: date(2021, 3, 15),
        position: 'Senior Developer',
        status: EmployeeStatus.WORKING,
        departmentId: techDept.id,
      },
    });

    const juniorDev = await prisma.employee.create({
      data: {
        employeeCode: 'EMP005',
        firstName: 'Văn',
        lastName: 'Hoàng',
        gender: 'Nam',
        birthday: date(1998, 9, 30),
        phone: '0905678901',
        email: 'hoang.van.em@company.com',
        address: 'Đà Nẵng',
        hireDate: date(2023, 6, 1),
        position: 'Developer',
        status: EmployeeStatus.WORKING,
        departmentId: techDept.id,
      },
    });

    const salesManager = await prisma.employee.create({
      data: {
        employeeCode: 'EMP006',
        firstName: 'Thị',
        lastName: 'Vũ',
        gender: 'Nữ',
        birthday: date(1987, 4, 12),
        phone: '0906789012',
        email: 'vu.thi.phuong@company.com',
        address: 'Hà Nội',
        hireDate: date(2019, 2, 1),
        position: 'Trưởng phòng Kinh doanh',
        status: EmployeeStatus.WORKING,
        departmentId: salesDept.id,
      },
    });

    const salesStaff = await prisma.employee.create({
      data: {
        employeeCode: 'EMP007',
        firstName: 'Quốc',
        lastName: 'Đặng',
        gender: 'Nam',
        birthday: date(1995, 12, 8),
        phone: '0907890123',
        email: 'dang.quoc.huy@company.com',
        address: 'Hải Phòng',
        hireDate: date(2022, 9, 10),
        position: 'Nhân viên Kinh doanh',
        status: EmployeeStatus.WORKING,
        departmentId: salesDept.id,
      },
    });

    const financeManager = await prisma.employee.create({
      data: {
        employeeCode: 'EMP008',
        firstName: 'Minh',
        lastName: 'Bùi',
        gender: 'Nam',
        birthday: date(1986, 6, 25),
        phone: '0908901234',
        email: 'bui.minh.khoa@company.com',
        address: 'Hà Nội',
        hireDate: date(2016, 11, 1),
        position: 'Kế toán trưởng',
        status: EmployeeStatus.WORKING,
        departmentId: financeDept.id,
      },
    });

    await Promise.all([
      prisma.department.update({
        where: { id: hrDept.id },
        data: { managerId: hrManager.id },
      }),
      prisma.department.update({
        where: { id: techDept.id },
        data: { managerId: techLead.id },
      }),
      prisma.department.update({
        where: { id: salesDept.id },
        data: { managerId: salesManager.id },
      }),
      prisma.department.update({
        where: { id: financeDept.id },
        data: { managerId: financeManager.id },
      }),
    ]);

    await Promise.all([
      prisma.user.create({
        data: {
          displayName: 'admin',
          email: 'admin@company.com',
          password: hashedPassword,
          roleId: adminRole.id,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          displayName: 'hr.manager',
          email: 'hr@company.com',
          password: hashedPassword,
          roleId: hrRole.id,
          employeeId: hrManager.id,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          displayName: 'hr.staff',
          email: 'hr.staff@company.com',
          password: hashedPassword,
          roleId: employeeRole.id,
          employeeId: hrStaff.id,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          displayName: 'tech.lead',
          email: 'tech@company.com',
          password: hashedPassword,
          roleId: managerRole.id,
          employeeId: techLead.id,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          displayName: 'dev1',
          email: 'dev1@company.com',
          password: hashedPassword,
          roleId: employeeRole.id,
          employeeId: seniorDev.id,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          displayName: 'dev2',
          email: 'dev2@company.com',
          password: hashedPassword,
          roleId: employeeRole.id,
          employeeId: juniorDev.id,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          displayName: 'sales.manager',
          email: 'sales@company.com',
          password: hashedPassword,
          roleId: managerRole.id,
          employeeId: salesManager.id,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          displayName: 'sales.staff',
          email: 'sales.staff@company.com',
          password: hashedPassword,
          roleId: employeeRole.id,
          employeeId: salesStaff.id,
          status: UserStatus.ACTIVE,
        },
      }),
    ]);

    await Promise.all([
      prisma.employeeSkill.create({
        data: {
          employeeId: seniorDev.id,
          skillId: tsSkill.id,
          level: 'Senior',
          experienceYear: 5,
        },
      }),
      prisma.employeeSkill.create({
        data: {
          employeeId: seniorDev.id,
          skillId: nestSkill.id,
          level: 'Senior',
          experienceYear: 4,
        },
      }),
      prisma.employeeSkill.create({
        data: {
          employeeId: juniorDev.id,
          skillId: jsSkill.id,
          level: 'Junior',
          experienceYear: 2,
        },
      }),
      prisma.employeeSkill.create({
        data: {
          employeeId: juniorDev.id,
          skillId: reactSkill.id,
          level: 'Junior',
          experienceYear: 1,
        },
      }),
      prisma.employeeSkill.create({
        data: {
          employeeId: financeManager.id,
          skillId: sqlSkill.id,
          level: 'Expert',
          experienceYear: 10,
        },
      }),
    ]);

    await Promise.all([
      prisma.education.create({
        data: {
          employeeId: seniorDev.id,
          school: 'Đại học Bách Khoa TP.HCM',
          major: 'Công nghệ thông tin',
          degree: 'Kỹ sư',
          startDate: date(2012, 9, 1),
          endDate: date(2016, 6, 30),
          gpa: 3.4,
        },
      }),
      prisma.education.create({
        data: {
          employeeId: juniorDev.id,
          school: 'Đại học Công nghệ Đà Nẵng',
          major: 'Công nghệ phần mềm',
          degree: 'Cử nhân',
          startDate: date(2016, 9, 1),
          endDate: date(2020, 6, 30),
          gpa: 3.1,
        },
      }),
      prisma.experience.create({
        data: {
          employeeId: seniorDev.id,
          company: 'ABC Technology',
          position: 'Full-stack Developer',
          startDate: date(2016, 8, 1),
          endDate: date(2021, 2, 28),
          description: 'Phát triển hệ thống quản lý nội bộ',
        },
      }),
      prisma.experience.create({
        data: {
          employeeId: techLead.id,
          company: 'XYZ Solutions',
          position: 'Tech Lead',
          startDate: date(2014, 1, 1),
          endDate: date(2017, 7, 31),
          description: 'Dẫn dắt team backend 8 người',
        },
      }),
    ]);

    await Promise.all([
      prisma.employmentHistory.create({
        data: {
          employeeId: seniorDev.id,
          departmentId: techDept.id,
          position: 'Developer',
          startDate: date(2021, 3, 15),
          endDate: date(2023, 12, 31),
          reason: 'Thăng chức',
        },
      }),
      prisma.employmentHistory.create({
        data: {
          employeeId: seniorDev.id,
          departmentId: techDept.id,
          position: 'Senior Developer',
          startDate: date(2024, 1, 1),
          reason: 'Thăng chức Senior',
        },
      }),
      prisma.employmentHistory.create({
        data: {
          employeeId: hrStaff.id,
          departmentId: hrDept.id,
          position: 'Chuyên viên Nhân sự',
          startDate: date(2020, 5, 1),
        },
      }),
    ]);

    const today = new Date();
    const attendanceEmployees = [seniorDev, juniorDev, hrStaff, salesStaff];

    for (let i = 0; i < 5; i++) {
      const workDate = new Date(today);
      workDate.setDate(today.getDate() - i);
      workDate.setHours(0, 0, 0, 0);

      for (const employee of attendanceEmployees) {
        const checkIn = new Date(workDate);
        checkIn.setHours(8, i === 0 ? 45 : 30, 0, 0);

        const checkOut = new Date(workDate);
        checkOut.setHours(17, 30, 0, 0);

        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            workDate,
            checkIn,
            checkOut,
            workingHours: i === 0 ? 7.75 : 8,
            overtimeHours: i === 2 ? 1.5 : 0,
            status:
              i === 0
                ? AttendanceStatus.LATE
                : i === 1
                  ? AttendanceStatus.WFH
                  : AttendanceStatus.PRESENT,
          },
        });
      }
    }

    await prisma.leaveRequest.create({
      data: {
        employeeId: juniorDev.id,
        leaveTypeId: annualLeave.id,
        startDate: date(2026, 7, 14),
        endDate: date(2026, 7, 16),
        reason: 'Nghỉ phép gia đình',
        status: LeaveStatus.PENDING,
      },
    });

    const payrollEmployees = [
      seniorDev,
      juniorDev,
      hrStaff,
      salesStaff,
      financeManager,
    ];

    for (const employee of payrollEmployees) {
      const basicSalary = 15000000;
      const allowance = 2000000;
      const overtimeSalary = employee.id === seniorDev.id ? 1500000 : 0;
      const bonusAmount = employee.id === salesStaff.id ? 3000000 : 1000000;
      const deduction = 500000;
      const insurance = 1200000;
      const tax = 800000;
      const netSalary =
        basicSalary +
        allowance +
        overtimeSalary +
        bonusAmount -
        deduction -
        insurance -
        tax;

      await prisma.payroll.create({
        data: {
          employeeId: employee.id,
          month: 5,
          year: 2026,
          basicSalary,
          allowance,
          overtimeSalary,
          bonus: bonusAmount,
          deduction,
          insurance,
          tax,
          netSalary,
          paymentDate: date(2026, 6, 5),
          status: 'PAID',
        },
      });
    }

    await prisma.bonus.create({
      data: {
        employeeId: salesStaff.id,
        title: 'Thưởng doanh số Q2/2026',
        amount: 5000000,
        bonusDate: date(2026, 6, 15),
        reason: 'Vượt chỉ tiêu doanh số',
      },
    });

    await prisma.insurance.create({
      data: {
        employeeId: seniorDev.id,
        insuranceNumber: 'BHXH-EMP004-001',
        type: InsuranceType.BHXH,
        provider: 'Bảo hiểm xã hội Việt Nam',
        startDate: date(2021, 3, 15),
        status: 'ACTIVE',
      },
    });

    await prisma.employeeBenefit.create({
      data: {
        employeeId: seniorDev.id,
        benefitId: healthInsurance.id,
        startDate: date(2024, 1, 1),
        status: 'ACTIVE',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
