import { jsPDF } from "jspdf";

export const generatePDFReport = async (user, reportData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFont("helvetica");
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  doc.text("ACADEMIC STUDY PLAN REPORT", 105, 20, null, null, 'center');
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("STUDENT INFORMATION", 20, 35);
  doc.setFontSize(11);
  doc.text(`Name: ${reportData.student_info.student_name}`, 20, 45);
  doc.text(`Email: ${reportData.student_info.student_email}`, 20, 52);
  doc.text(`Intake Session: ${reportData.student_info.intake_session}`, 20, 59);
  doc.text(`Final CGPA: ${reportData.final_cgpa}`, 20, 66);
  doc.text(`Total Credits Accumulated: ${reportData.total_credits_accumulated}`, 20, 73);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 78, 190, 78);

  let yPosition = 85;
  Object.entries(reportData.academic_record).forEach(([semester, data]) => {
    if (yPosition > 250) { doc.addPage(); yPosition = 20; }
    doc.setFontSize(13);
    doc.setTextColor(52, 152, 219);
    doc.text(`SEMESTER ${semester}`, 20, yPosition);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`GPA: ${data.gpa} | Total Credits: ${data.total_credits}`, 140, yPosition);
    yPosition += 8;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, 170, 8, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Course Code", 25, yPosition + 5);
    doc.text("Course Name", 60, yPosition + 5);
    doc.text("Credits", 140, yPosition + 5);
    doc.text("Grade", 155, yPosition + 5);
    doc.text("Status", 170, yPosition + 5);
    yPosition += 10;
    doc.setFont("helvetica", "normal");

    data.courses.forEach(course => {
      if (yPosition > 280) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(9);
      doc.text(course.course_code, 25, yPosition + 5);
      const courseName = course.COURSE.course_name;
      if (courseName.length > 40) {
        doc.text(courseName.substring(0, 40), 60, yPosition + 5);
        if (courseName.substring(40, 80)) { yPosition += 4; doc.text(courseName.substring(40, 80), 60, yPosition + 5); yPosition -= 4; }
      } else { doc.text(courseName, 60, yPosition + 5); }
      doc.text(course.COURSE.credit_hour.toString(), 140, yPosition + 5);
      doc.text(course.grade || "-", 155, yPosition + 5);
      
      if (course.status === "Completed") doc.setTextColor(39, 174, 96);
      else if (course.status === "Current") doc.setTextColor(41, 128, 185);
      else doc.setTextColor(149, 165, 166);
      
      doc.text(course.status, 170, yPosition + 5);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;
    });
    yPosition += 10;
  });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 290);
  doc.text("StudyPlan System - Academic Report", 105, 290, null, null, 'center');
  
  const fileName = `${user.student_name.replace(/\s+/g, '_')}_StudyPlan_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};