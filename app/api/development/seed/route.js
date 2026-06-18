import { NextResponse } from 'next/server';
import Development from '@/models/Development';
import connectDB from '@/lib/dbConnect';

export async function POST(request) {
  await connectDB();

  try {
    // Check if data already exists
    const existingCount = await Development.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json(
        { message: 'Test data already exists. Clear database first if you want to re-seed.' },
        { status: 400 }
      );
    }

    const testProjects = [
      {
        title: 'CC Road Construction - Ward 3 to School',
        description: '500m CC road with side drains for better drainage',
        scheme: '15th Finance Commission',
        financialYear: '2025-2026',
        sanctionedAmount: 850000,
        amountSpent: 552500,
        wardNo: 3,
        location: {
          latitude: 28.5355,
          longitude: 77.3937,
          address: 'Ward No. 3, Near Hanuman Mandir, Village XYZ'
        },
        status: 'Ongoing',
        physicalProgress: 65,
        startDate: new Date('2025-04-15'),
        expectedCompletion: new Date('2025-09-30'),
        implementingAgency: 'PWD, Lucknow Division',
        beneficiaryCount: '180 families, 1 school',
        displayOrder: 1
      },
      {
        title: 'Irrigation Canal Repair and Maintenance',
        description: '10km canal renovation with concrete lining',
        scheme: 'MNREGA',
        financialYear: '2024-2025',
        sanctionedAmount: 600000,
        amountSpent: 600000,
        wardNo: 5,
        location: {
          latitude: 28.5420,
          longitude: 77.3950,
          address: 'Ward No. 5, Main Canal Area'
        },
        status: 'Completed',
        physicalProgress: 100,
        startDate: new Date('2024-08-01'),
        expectedCompletion: new Date('2025-03-31'),
        actualCompletion: new Date('2025-03-15'),
        implementingAgency: 'Irrigation Department',
        beneficiaryCount: '2500+ farmers',
        displayOrder: 2
      },
      {
        title: 'Solar Street Light Installation',
        description: 'Installation of 150 solar street lights in all wards',
        scheme: 'Gram Nidhi',
        financialYear: '2025-2026',
        sanctionedAmount: 450000,
        amountSpent: 225000,
        wardNo: 1,
        location: {
          latitude: 28.5280,
          longitude: 77.3890,
          address: 'Ward No. 1, Main Street'
        },
        status: 'Ongoing',
        physicalProgress: 50,
        startDate: new Date('2025-05-01'),
        expectedCompletion: new Date('2025-10-31'),
        implementingAgency: 'Local Contractor: Ramesh Kumar',
        beneficiaryCount: 'Entire village',
        displayOrder: 3
      },
      {
        title: 'School Building Renovation',
        description: 'Complete renovation and modernization of primary school building',
        scheme: 'PMAY',
        financialYear: '2024-2025',
        sanctionedAmount: 1200000,
        amountSpent: 1100000,
        wardNo: 3,
        location: {
          latitude: 28.5340,
          longitude: 77.3920,
          address: 'Ward No. 3, Near Hanuman Mandir, Government Primary School'
        },
        status: 'Completed',
        physicalProgress: 95,
        startDate: new Date('2024-06-15'),
        expectedCompletion: new Date('2025-04-30'),
        actualCompletion: new Date('2025-05-10'),
        implementingAgency: 'Education Department',
        beneficiaryCount: '450+ students, 25 teachers',
        displayOrder: 4
      },
      {
        title: 'Community Health Center Upgrade',
        description: 'Addition of new ward and medical equipment',
        scheme: 'Swachh Bharat',
        financialYear: '2025-2026',
        sanctionedAmount: 350000,
        amountSpent: 150000,
        wardNo: 2,
        location: {
          latitude: 28.5310,
          longitude: 77.3905,
          address: 'Ward No. 2, Near Panchayat Office'
        },
        status: 'Sanctioned',
        physicalProgress: 0,
        startDate: new Date('2025-07-01'),
        expectedCompletion: new Date('2025-11-30'),
        implementingAgency: 'Health Department',
        beneficiaryCount: '5000+ villagers',
        displayOrder: 5
      },
      {
        title: 'Water Supply Pipeline Expansion',
        description: 'Extension of water supply to 50 new households',
        scheme: 'Jal Jeevan Mission',
        financialYear: '2025-2026',
        sanctionedAmount: 500000,
        amountSpent: 350000,
        wardNo: 4,
        location: {
          latitude: 28.5380,
          longitude: 77.3960,
          address: 'Ward No. 4, New Housing Colony'
        },
        status: 'Ongoing',
        physicalProgress: 70,
        startDate: new Date('2025-03-01'),
        expectedCompletion: new Date('2025-08-31'),
        implementingAgency: 'Water Supply Authority',
        beneficiaryCount: '50 households, ~350 people',
        displayOrder: 6
      }
    ];

    const savedProjects = await Development.insertMany(testProjects);

    return NextResponse.json(
      {
        message: 'Test data seeded successfully',
        count: savedProjects.length,
        projects: savedProjects
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { message: 'Failed to seed test data', error: error.message },
      { status: 500 }
    );
  }
}
