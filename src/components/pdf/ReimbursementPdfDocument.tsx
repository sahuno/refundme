import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface RequestPdf {
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

export function ReimbursementPdfDocument({ request, items }: { request: RequestPdf, items: ItemPdf[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.body}>
        <Text style={styles.header}>Reimbursement Request</Text>
        <Text>Student Name: {request.student_name}</Text>
        <Text>Date: {new Date(request.created_at).toLocaleDateString()}</Text>
        <Text>Total: ${request.total_amount.toFixed(2)}</Text>
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
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  body: { padding: 24 },
  header: { fontSize: 20, marginBottom: 16, fontWeight: 'bold' },
  table: { display: 'table', width: 'auto', marginTop: 16 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '25%', fontWeight: 'bold', fontSize: 12, borderBottom: 1, marginBottom: 4 },
  tableCol: { width: '25%', fontSize: 10 },
}) 