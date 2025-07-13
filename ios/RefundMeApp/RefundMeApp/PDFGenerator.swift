import PDFKit
import SwiftUI

struct PDFGenerator {
    static func generateReimbursementPDF(for request: ReimbursementRequest, items: [ReimbursementItem], profile: User) -> Data? {
        let pdfMetaData = [
            kCGPDFContextCreator: "RefundMe App",
            kCGPDFContextTitle: "Reimbursement Request #\(request.id.uuidString.prefix(8))"
        ]
        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = pdfMetaData as [String: Any]
        
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // Letter size
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)
        
        let data = renderer.pdfData { context in
            context.beginPage()
            
            let attributes = [
                NSAttributedString.Key.font: UIFont.systemFont(ofSize: 12)
            ]
            let boldAttributes = [
                NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 14)
            ]
            let titleAttributes = [
                NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 24)
            ]
            
            var yPosition: CGFloat = 50
            
            // Title
            let title = "REIMBURSEMENT REQUEST"
            title.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: titleAttributes)
            yPosition += 40
            
            // Request Info Section
            "Request Information".draw(at: CGPoint(x: 50, y: yPosition), withAttributes: boldAttributes)
            yPosition += 25
            
            drawLabelValue("Request ID:", value: String(request.id.uuidString.prefix(8)), at: CGPoint(x: 50, y: yPosition), attributes: attributes)
            yPosition += 20
            
            drawLabelValue("Date:", value: formatDate(request.createdAt), at: CGPoint(x: 50, y: yPosition), attributes: attributes)
            yPosition += 20
            
            drawLabelValue("Status:", value: request.status?.capitalized ?? "Draft", at: CGPoint(x: 50, y: yPosition), attributes: attributes)
            yPosition += 20
            
            if let submittedAt = request.submittedAt {
                drawLabelValue("Submitted:", value: formatDate(submittedAt), at: CGPoint(x: 50, y: yPosition), attributes: attributes)
                yPosition += 20
            }
            
            // User Info Section
            yPosition += 20
            "User Information".draw(at: CGPoint(x: 50, y: yPosition), withAttributes: boldAttributes)
            yPosition += 25
            
            drawLabelValue("Name:", value: profile.fullName ?? profile.email, at: CGPoint(x: 50, y: yPosition), attributes: attributes)
            yPosition += 20
            
            drawLabelValue("Email:", value: profile.email, at: CGPoint(x: 50, y: yPosition), attributes: attributes)
            yPosition += 20
            
            if let department = profile.department {
                drawLabelValue("Department:", value: department, at: CGPoint(x: 50, y: yPosition), attributes: attributes)
                yPosition += 20
            }
            
            // Request Details
            yPosition += 20
            "Request Details".draw(at: CGPoint(x: 50, y: yPosition), withAttributes: boldAttributes)
            yPosition += 25
            
            drawLabelValue("Description:", value: request.description ?? "Reimbursement Request", at: CGPoint(x: 50, y: yPosition), attributes: attributes)
            yPosition += 20
            
            if let adminEmail = request.adminEmail {
                drawLabelValue("Admin Email:", value: adminEmail, at: CGPoint(x: 50, y: yPosition), attributes: attributes)
                yPosition += 20
            }
            
            // Expense Items Table
            yPosition += 30
            "Expense Items".draw(at: CGPoint(x: 50, y: yPosition), withAttributes: boldAttributes)
            yPosition += 25
            
            // Table header
            drawTableHeader(at: CGPoint(x: 50, y: yPosition), attributes: attributes)
            yPosition += 25
            
            // Table rows
            for item in items {
                drawTableRow(item: item, at: CGPoint(x: 50, y: yPosition), attributes: attributes)
                yPosition += 20
                
                // Check if we need a new page
                if yPosition > 700 {
                    context.beginPage()
                    yPosition = 50
                }
            }
            
            // Total
            yPosition += 10
            drawLine(from: CGPoint(x: 50, y: yPosition), to: CGPoint(x: 562, y: yPosition))
            yPosition += 15
            
            let total = "TOTAL: $\(formatCurrency(request.totalAmount ?? 0))"
            let totalSize = total.size(withAttributes: boldAttributes)
            total.draw(at: CGPoint(x: 562 - totalSize.width, y: yPosition), withAttributes: boldAttributes)
            
            // Footer
            yPosition = 720
            let footer = "Generated on \(formatDate(Date())) by RefundMe App"
            let footerSize = footer.size(withAttributes: attributes)
            footer.draw(at: CGPoint(x: (612 - footerSize.width) / 2, y: yPosition), withAttributes: attributes)
        }
        
        return data
    }
    
    // MARK: - Helper Methods
    
    private static func drawLabelValue(_ label: String, value: String, at point: CGPoint, attributes: [NSAttributedString.Key: Any]) {
        label.draw(at: point, withAttributes: attributes)
        value.draw(at: CGPoint(x: point.x + 150, y: point.y), withAttributes: attributes)
    }
    
    private static func drawTableHeader(at point: CGPoint, attributes: [NSAttributedString.Key: Any]) {
        "Date".draw(at: point, withAttributes: attributes)
        "Description".draw(at: CGPoint(x: point.x + 80, y: point.y), withAttributes: attributes)
        "Category".draw(at: CGPoint(x: point.x + 300, y: point.y), withAttributes: attributes)
        "Amount".draw(at: CGPoint(x: point.x + 420, y: point.y), withAttributes: attributes)
        
        drawLine(from: CGPoint(x: point.x, y: point.y + 15), to: CGPoint(x: point.x + 512, y: point.y + 15))
    }
    
    private static func drawTableRow(item: ReimbursementItem, at point: CGPoint, attributes: [NSAttributedString.Key: Any]) {
        let dateStr = formatDate(item.transactionDate ?? Date(), style: .short)
        dateStr.draw(at: point, withAttributes: attributes)
        
        let description = item.description.count > 40 ? String(item.description.prefix(37)) + "..." : item.description
        description.draw(at: CGPoint(x: point.x + 80, y: point.y), withAttributes: attributes)
        
        (item.category ?? "Other").draw(at: CGPoint(x: point.x + 300, y: point.y), withAttributes: attributes)
        
        let amount = "$\(formatCurrency(item.amount))"
        let amountSize = amount.size(withAttributes: attributes)
        amount.draw(at: CGPoint(x: point.x + 470 - amountSize.width, y: point.y), withAttributes: attributes)
    }
    
    private static func drawLine(from start: CGPoint, to end: CGPoint) {
        let path = UIBezierPath()
        path.move(to: start)
        path.addLine(to: end)
        UIColor.black.setStroke()
        path.stroke()
    }
    
    private static func formatDate(_ date: Date, style: DateFormatter.Style = .medium) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = style
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
    
    private static func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSDecimalNumber(decimal: amount)) ?? "0.00"
    }
    
}