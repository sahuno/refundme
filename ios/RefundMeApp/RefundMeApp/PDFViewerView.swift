import SwiftUI
import PDFKit

struct PDFViewerView: View {
    let pdfData: Data
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            PDFKitView(pdfData: pdfData)
                .navigationTitle("Reimbursement PDF")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Done") {
                            dismiss()
                        }
                    }
                    
                    ToolbarItem(placement: .navigationBarTrailing) {
                        ShareLink(item: pdfData, preview: SharePreview("Reimbursement Request")) {
                            Image(systemName: "square.and.arrow.up")
                        }
                    }
                }
        }
    }
}

struct PDFKitView: UIViewRepresentable {
    let pdfData: Data
    
    func makeUIView(context: Context) -> PDFView {
        let pdfView = PDFView()
        pdfView.autoScales = true
        pdfView.displayMode = .singlePageContinuous
        
        if let document = PDFDocument(data: pdfData) {
            pdfView.document = document
        }
        
        return pdfView
    }
    
    func updateUIView(_ uiView: PDFView, context: Context) {
        // No updates needed
    }
}