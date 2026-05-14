
import { NextResponse } from 'next/server';
import Topics from '@/models/topic.model';
import { ConnectDB } from '@/lib/connectDb';
import Subjects from '@/models/subject.model';

export async function GET(req: Request) {
  try {
    await ConnectDB();

    // Check if subjects exist
    const existingSubjects = await Subjects.countDocuments();
    if (existingSubjects > 0) {
      return NextResponse.json({
        message: 'Subjects already exist in database',
        count: existingSubjects,
      });
    }

    // Seed subjects and topics
    const subjectsData = [
      {
        name: 'Mathematics',
        topics: ['Algebra', 'Geometry', 'Calculus', 'Linear Algebra', 'Trigonometry'],
      },
      {
        name: 'Physics',
        topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Quantum Physics'],
      },
      {
        name: 'Chemistry',
        topics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry'],
      },
      {
        name: 'Computer Science',
        topics: ['Data Structures', 'Algorithms', 'Web Development', 'Database', 'Machine Learning'],
      },
      {
        name: 'English',
        topics: ['Writing', 'Literature', 'Grammar', 'Essay Writing', 'Public Speaking'],
      },
      {
        name: 'History',
        topics: ['Ancient History', 'Medieval History', 'Modern History', 'World War', 'Civilization'],
      },
      {
        name: 'Biology',
        topics: ['Cell Biology', 'Genetics', 'Ecology', 'Evolution', 'Human Anatomy'],
      },
    ];

    const createdSubjects = [];

    for (const subjectData of subjectsData) {
      // Create subject
      const subject = await Subjects.create({ name: subjectData.name });

      // Create topics for this subject
      const topicDocs = await Topics.insertMany(
        subjectData.topics.map((topicName) => ({
          name: topicName,
          subject: subject._id,
        }))
      );

      createdSubjects.push({
        subject: subject.name,
        topicCount: topicDocs.length,
      });
    }

    return NextResponse.json({
      message: 'Subjects and topics seeded successfully',
      subjects: createdSubjects,
    });
  } catch (error) {
    console.error('Error seeding subjects:', error);
    return NextResponse.json(
      { error: 'Failed to seed subjects' },
      { status: 500 }
    );
  }
}
