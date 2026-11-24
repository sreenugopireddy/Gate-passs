import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function AdminStudents(){
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [importResults, setImportResults] = useState(null)

  const token = localStorage.getItem('token')

  useEffect(()=>{
    fetchStudents()
  },[])

  const fetchStudents = async () => {
    setLoading(true)
    try{
      const res = await axios.get('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
      setStudents(res.data.students)
    }catch(err){ 
      setError(err.response?.data?.message || 'Failed to fetch students')
      console.error(err) 
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      const validExtensions = ['.csv', '.xlsx']
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      
      if (!validExtensions.includes(fileExt)) {
        setError('Please upload a CSV or Excel (.xlsx) file')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
    }
  }

  const handleBulkImport = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/admin/students/bulk-import', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setSuccess(response.data.message)
      setImportResults(response.data.results)
      setFile(null)
      
      // Refresh student list
      await fetchStudents()
      
      // Reset file input
      e.target.reset()
    } catch (err) {
      setError(err.response?.data?.message || 'Error importing students')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Container className="mt-5 mb-5">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary fw-bold">Student Management</h2>
          <p className="text-muted">View all students or import new students via CSV/Excel</p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Row className="mb-4">
        <Col lg="5">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-4">📥 Bulk Import Students</Card.Title>
              
              <Form onSubmit={handleBulkImport}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Select CSV or Excel File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <Form.Text className="text-muted">
                    Supported formats: CSV, Excel (.xlsx)
                  </Form.Text>
                </Form.Group>

                <div className="mb-4 p-3 bg-light rounded">
                  <h6 className="fw-bold mb-2">📋 File Format</h6>
                  <small className="text-muted">
                    Your file should have columns:<br />
                    <code>Name, Roll, Email, Mobile, ParentMobile, Year, Branch, Section</code>
                  </small>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 fw-bold"
                  disabled={uploading || !file}
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Importing...
                    </>
                  ) : (
                    `Import Students${file ? ` (${file.name})` : ''}`
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {importResults && (
            <Card className="shadow-sm mt-3 border-info">
              <Card.Body>
                <Card.Title className="mb-3 text-info">Import Results</Card.Title>
                <div className="mb-2">
                  <strong>Created:</strong> <Badge bg="success">{importResults.created}</Badge>
                </div>
                {importResults.errors?.length > 0 && (
                  <div>
                    <strong>Errors:</strong> <Badge bg="danger">{importResults.errors.length}</Badge>
                    <div className="mt-2">
                      {importResults.errors.slice(0, 5).map((err, idx) => (
                        <div key={idx} className="small text-danger">
                          Row {err.row}: {err.reason}
                        </div>
                      ))}
                      {importResults.errors.length > 5 && (
                        <div className="small text-muted mt-2">
                          +{importResults.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg="7">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">
                👥 All Students ({students.length})
              </Card.Title>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No students found. Use bulk import to add students.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table bordered hover size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>Name</th>
                        <th>Roll</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 15).map(s => (
                        <tr key={s._id}>
                          <td className="fw-bold">{s.name}</td>
                          <td>{s.studentId || '-'}</td>
                          <td><small>{s.email}</small></td>
                          <td>{s.department || '-'}</td>
                          <td>{s.year || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              {students.length > 15 && (
                <p className="text-muted text-center mt-3 small">
                  Showing 15 of {students.length} students
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
