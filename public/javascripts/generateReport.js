const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');
const fs = require('fs');

async function generateReport(reportType, data) {
    try {
        if (reportType === 'pdf') {
            const doc = new PDFDocument()
            // const headers = [['Product'], ['Price'], ['Quantity'], ['Subtotal']]
            const tData = data[0].products.map(product => {
                return [
                    product.name,
                    product.price,
                    product.quantity,
                    product.price * product.quantity
                ]
            })
            const subtotal = ['', '', 'Subtotal : ', data[0].totalPrice]
            const tax = ['', '', 'Tax : ', '0']
            const shipping = ['', '', 'Shipping charge : ', '0']
            const total = ['', '', 'Total : ', data[0].totalPrice]
            tData.push(subtotal, tax, shipping, total)
            const table = {
                title: 'CRAZE',
                subtitle: 'Invoice',
                headers: ['Product', 'Price', 'Quantity', 'Subtotal'],
                rows: tData

            }
            await doc.table(table)

            // doc.text(JSON.stringify(data))
            const filename = 'sales-report.pdf'
            const writeStream = fs.createWriteStream(filename)
            doc.pipe(writeStream)
            doc.end()
            await new Promise((resolve, reject) => {
                writeStream.on('finish', () => {
                    console.log(`PDF report saved to ${filename}`)
                    resolve(filename)
                })
                writeStream.on('error', (error) => {
                    console.error(`Error saving PDF report: ${error}`)
                    reject(error)
                })
            })
            return filename

        } else if (reportType === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');
            // Extract keys from data object
            const keys = Object.keys(data);

            // Create columns in Excel worksheet
            const columns = keys.map(key => ({ header: key, key: key }))
            worksheet.columns = columns;

            // Add row to worksheet with data from object
            worksheet.addRow(data);

            const filename = 'sales-report.xlsx';
            await workbook.xlsx.writeFile(filename);
            console.log(`Excel report saved to ${filename}`);
            return filename;
        } else {
            throw new Error(`Invalid report type: ${reportType}`);
        }
    } catch (error) {
        console.error(`Error generating ${reportType} report: ${error}`);
        throw error;
    }
}

module.exports = generateReport;