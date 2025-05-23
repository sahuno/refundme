import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface RequestPdf {
  id?: string
  student_name: string
  created_at: string
  total_amount: number
}

interface ItemPdf {
  date: string
  description: string
  category: string
  amount: number
}

interface ReimbursementPdfDocumentProps {
  request: RequestPdf
  items: ItemPdf[]
}

export function ReimbursementPdfDocument({ request, items }: ReimbursementPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.body}>
        <Text style={styles.header}>Reimbursement Request</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Student Name: {request.student_name}</Text>
          <Text style={styles.label}>Date Submitted: {new Date(request.created_at).toLocaleDateString()}</Text>
          <Text style={styles.label}>Total Amount: ${request.total_amount.toFixed(2)}</Text>
          <Text style={styles.label}>Request ID: {request.id || 'N/A'}</Text>
        </View>

        <Text style={styles.sectionHeader}>Expense Items</Text>
        
        {items.length === 0 ? (
          <Text style={styles.noItems}>No items found for this request.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Date</Text>
              <Text style={styles.tableColHeader}>Description</Text>
              <Text style={styles.tableColHeader}>Category</Text>
              <Text style={styles.tableColHeader}>Amount</Text>
            </View>
            {items.map((item, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.tableCol}>{item.date}</Text>
                <Text style={styles.tableCol}>{item.description}</Text>
                <Text style={styles.tableCol}>{item.category}</Text>
                <Text style={styles.tableCol}>${item.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString()} by RefundMe System
          </Text>
        </View>
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  body: { padding: 24 },
  header: { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' },
  section: { marginBottom: 20 },
  label: { fontSize: 12, marginBottom: 4 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 16 },
  table: { width: 'auto', marginTop: 16 },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderBottomColor: '#000', paddingBottom: 4, paddingTop: 4 },
  tableColHeader: { width: '25%', fontWeight: 'bold', fontSize: 12 },
  tableCol: { width: '25%', fontSize: 10 },
  noItems: { fontSize: 12, fontStyle: 'italic', color: '#666', textAlign: 'center', marginTop: 20 },
  footer: { position: 'absolute', bottom: 30, left: 24, right: 24 },
  footerText: { fontSize: 10, textAlign: 'center', color: '#666' },
}) 