import connectDb from '@/lib/connectDb';
import Sessions from '@/models/sesion.model';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id: sessionId } = await params;
    const body = await req.json();
    
    // Accept fileUrl as either an external link or text snippet, and resourceType as 'link' or 'snippet'
    const { uploadedBy, fileUrl, resourceType, title, timestamp } = body;

    if (!uploadedBy || !fileUrl || !resourceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newResource = {
      uploadedBy,
      fileUrl, // acts as the content/snippet as well
      resourceType,
      title: title || 'Shared Resource',
      uploadedAt: timestamp || new Date()
    };

    // Need to update the schema slightly if we add 'title', but MongoDB handles loose schemas inside arrays if we didn't specify strict mode. 
    // Actually, I'll update the session schema to formally include title.
    await Sessions.findByIdAndUpdate(sessionId, {
      $push: { resources: newResource }
    });

    return NextResponse.json({ success: true, resource: newResource });
  } catch (error) {
    console.error('Error saving resource:', error);
    return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
  }
}
