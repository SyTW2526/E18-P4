describe('API E2E: shared_accounts CRUD', () => {
  const base = Cypress.env('API_BASE') || 'http://localhost:5200'

  it('POST /shared_accounts -> GET /shared_accounts -> DELETE /shared_accounts/:id', () => {
    const name = `TestGroup ${Date.now()}`
  const payload = { nombre: name, descripcion: 'Grupo de prueba', moneda: 'eur', creador_id: 'test-creator' }

    // create
    cy.request({ method: 'POST', url: `${base}/shared_accounts/`, body: payload }).then((res) => {
      expect(res.status).to.equal(201)
      expect(res.body).to.have.property('id')
      const id = res.body.id

      // list and verify
      cy.request({ method: 'GET', url: `${base}/shared_accounts/` }).then((list) => {
        expect(list.status).to.equal(200)
        const found = list.body.find((g: any) => String(g._id) === String(id) || String(g.id) === String(id) || g.nombre === name)
        expect(found).to.exist
      })

      // delete
      cy.request({ method: 'DELETE', url: `${base}/shared_accounts/${id}` }).then((d) => {
        expect([200,202,204]).to.include(d.status)
      })
    })
  })
})
