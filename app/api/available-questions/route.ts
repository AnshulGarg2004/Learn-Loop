import { connectDB } from '@/lib/connectDb';
import HelpRequest from '@/app/models/helpRequest.model';
import Subject from '@/app/models/subject.model';
import Topic from '@/app/models/topic.model';
import Users from '@/app/models/user.model';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    await connectDB();

    // Get all open help requests
    const helpRequests = await HelpRequest.find({ status: 'open' })
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('student', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Transform data for response
    const questions = helpRequests.map((request: any) => ({
      _id: request._id,
      title: request.title,
      description: request.description,
      subject: request.subject?.name || 'Unknown',
      topic: request.topic?.name || 'Unknown',
      student: {
        name: `${request.student?.firstName || ''} ${request.student?.lastName || ''}`.trim(),
      },
      urgencyLevel: request.urgencyLevel,
      creditsOffered: request.creditsOffered,
      createdAt: new Date(request.createdAt).toLocaleDateString(),
      applicationsCount: request.applications?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Error fetching available questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
