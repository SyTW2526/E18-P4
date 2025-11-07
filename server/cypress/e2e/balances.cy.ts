describe('API E2E: balances endpoint', () => {
  const base = Cypress.env('API_BASE') || 'http://localhost:5200'

  it('creates users, gasto with participaciones and verifies numeric balances', () => {
    const ts = Date.now()
    const emailA = `cypressA+${ts}@example.com`
    const emailB = `cypressB+${ts}@example.com`

    // signup two users
    cy.request('POST', `${base}/users/signup`, { nombre: 'A', email: emailA, password: 'Test1234' }).then((ra) => {
      expect(ra.status).to.equal(201)
      const userA = ra.body.user
      const idA = String(userA._id || userA.id || userA)

      cy.request('POST', `${base}/users/signup`, { nombre: 'B', email: emailB, password: 'Test1234' }).then((rb) => {
        expect(rb.status).to.equal(201)
        const userB = rb.body.user
        const idB = String(userB._id || userB.id || userB)

        // create group with creador_id = idA
        const groupName = `BalancesGroup ${ts}`
        cy.request('POST', `${base}/shared_accounts/`, { nombre: groupName, descripcion: 'Grupo balances', moneda: 'EUR', creador_id: idA }).then((rg) => {
          expect(rg.status).to.equal(201)
          const groupId = String(rg.body.id || rg.body.insertedId || rg.body)

          // create a gasto with explicit id_gasto so participaciones can reference it
          const gastoId = `gasto-${ts}`
          const gasto = { id_grupo: groupId, id_gasto: gastoId, descripcion: 'Cena', monto: 100, id_pagador: idA, fecha: new Date().toISOString(), categoria: 'food' }
          cy.request('POST', `${base}/gastos/`, gasto).then((rgasto) => {
            expect(rgasto.status).to.equal(201)

            // create participaciones: A -> 60, B -> 40
            cy.request('POST', `${base}/participaciones/`, { id_usuario: idA, id_gasto: gastoId, monto_asignado: 60 }).then((p1) => {
              expect(p1.status).to.equal(201)
              cy.request('POST', `${base}/participaciones/`, { id_usuario: idB, id_gasto: gastoId, monto_asignado: 40 }).then((p2) => {
                expect(p2.status).to.equal(201)

                // now fetch balances and assert numbers
                cy.request('GET', `${base}/shared_accounts/${groupId}/balances`).then((b) => {
                  expect(b.status).to.equal(200)
                  expect(Array.isArray(b.body)).to.be.true
                  const arr = b.body as any[]
                  const a = arr.find((x) => String(x.userId) === String(idA))
                  const bb = arr.find((x) => String(x.userId) === String(idB))
                  expect(!!a).to.be.true
                  expect(!!bb).to.be.true
                  // paid - share (use numeric comparison)
                  expect(Number(a.balance)).to.equal(40)
                  expect(Number(bb.balance)).to.equal(-40)

                  // cleanup: delete participaciones (best-effort), gasto, group
                  // delete participaciones by id if returned, otherwise ignore
                  ;[p1, p2].forEach((pRes: any) => {
                    const pid = pRes.body?.id || pRes.body?.insertedId
                    if (pid) cy.request({ method: 'DELETE', url: `${base}/participaciones/${pid}` }).then(() => {})
                  })

                  // delete gasto
                  const gastoMongoId = rgasto.body?.id || rgasto.body?.insertedId
                  if (gastoMongoId) cy.request({ method: 'DELETE', url: `${base}/gastos/${gastoMongoId}` }).then(() => {})

                  // delete group
                  if (groupId) cy.request({ method: 'DELETE', url: `${base}/shared_accounts/${groupId}` }).then(() => {})
                })
              })
            })
          })
        })
      })
    })
  })
})
