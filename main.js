document.addEventListener('DOMContentLoaded', function() {
    // Formatear monto de entrada con comas
    const montoInput = document.getElementById('monto');
    if (montoInput) {
        montoInput.addEventListener('input', function(e) {
            // Obtener el valor sin comas ni caracteres no numéricos excepto punto decimal
            let value = e.target.value.replace(/[^\d.]/g, '');
            
            // Eliminar puntos decimales adicionales
            const decimalParts = value.split('.');
            if (decimalParts.length > 2) {
                value = decimalParts[0] + '.' + decimalParts.slice(1).join('');
            }
        
            
            // Separar parte entera y decimal
            const parts = value.split('.');
            let integerPart = parts[0];
            const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
            
            // Agregar comas a la parte entera
            if (integerPart.length > 3) {
                integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            
            // Combinar y actualizar el valor
            e.target.value = integerPart + decimalPart;
        });
        
        // Al perder el foco, asegurar el formato correcto para cálculos
        montoInput.addEventListener('blur', function(e) {
            let value = e.target.value.replace(/,/g, '');
            if (value === '') value = '0';
            e.target.value = parseFloat(value).toLocaleString('en-US');
        });
    }

    // Datos de préstamos
    const TIPOS_PRESTAMO = {
        "Banco Popular": [
            "Préstamo Personal",
            "Préstamo Hipotecario",
            "Préstamo con Garantía Hipotecaria",
            "Préstamo con Garantía Prendaria (vehículo)",
            "Préstamo Pignorado (con garantía de certificados o cuentas)",
            "Préstamo Comercial para PYMEs",
            "Préstamo Nómina",
            "Préstamo en Tiendas Afiliadas (cuotas sin intereses)"
        ],
        "Banreservas": [
            "Préstamo Personal",
            "Préstamo Hipotecario",
            "Préstamo en Dólares (para proyectos o dominicanos en el exterior)",
            "Préstamo Comercial / Empresarial"
        ],
        "Banesco": [
            "Préstamo Hipotecario",
            "Préstamo Personal",
            "Préstamo Comercial / Empresarial"
        ]
    };

    const INFO_PRESTAMOS = {
        "Préstamo Personal": `
            Puedes realizar abonos parciales o cancelar anticipadamente tu préstamo personal en cualquier momento. Durante los primeros <span class="resaltado">5 años</span>, si decides abonar el <span class="resaltado">20%</span> o más del capital adeudado, se aplicará una penalización del <span class="resaltado">2.5%</span> sobre el monto abonado. Para evitar penalización, puedes abonar hasta el <span class="resaltado">19.9%</span> del capital sin restricciones.
        `,
        "Préstamo Hipotecario": `
            🏠 Este préstamo permite abonos anticipados totales o parciales en cualquier momento. Durante los primeros <span class="resaltado">5 años</span>, si abonas el <span class="resaltado">20%</span> o más del capital pendiente, se te cobrará una penalización del <span class="resaltado">2.5%</span> sobre el monto abonado. Puedes abonar libremente hasta el <span class="resaltado">19.9%</span> sin penalidad.
        `,
        "Préstamo con Garantía Hipotecaria": `
            🧾 Puedes abonar capital o saldar el préstamo en cualquier momento. En el primer año, si abonas el <span class="resaltado">20%</span> o más del capital, se aplica una penalización del <span class="resaltado">2.5%</span>. Durante el segundo año, la penalización baja al <span class="resaltado">2.0%</span>. Abonos menores a esos límites no generan penalidad.
        `,
        "Préstamo con Garantía Prendaria (vehículo)": `
            🚗 Puedes realizar abonos parciales o totales sin ninguna penalización establecida en la documentación oficial. Se recomienda confirmar con un ejecutivo de cuenta, aunque normalmente puedes abonar cualquier cantidad sin cargo adicional.
        `,
        "Préstamo Pignorado (con garantía de certificados o cuentas)": `
            💰 Este tipo de préstamo suele permitir abonos anticipados sin penalización, ya que está respaldado por un producto financiero del propio banco. Puedes abonar o saldar en cualquier momento, aunque se recomienda verificar condiciones específicas con tu asesor.
        `,
        "Préstamo Comercial para PYMEs": `
            🏢 Puedes abonar parte del capital o saldar el préstamo cuando desees. Durante el primer año, si abonas el <span class="resaltado">20%</span> o más del capital, se aplica una penalización del <span class="resaltado">2.5%</span>. Entre el segundo y tercer año, la penalización puede reducirse. Puedes abonar libremente hasta el <span class="resaltado">19.9%</span> del capital en ese periodo sin penalidad.
        `,
        "Préstamo Nómina": `
            👨‍💼 Puedes abonar cualquier monto al capital o cancelar anticipadamente el préstamo sin restricciones establecidas. No se detalla penalización por abonos anticipados, por lo que normalmente puedes abonar lo que desees en cualquier momento.
        `,
        "Préstamo en Tiendas Afiliadas (cuotas sin intereses)": `
            🛍️ Puedes adelantar pagos o saldar el préstamo sin penalidades. Este producto está diseñado para pagos a plazos sin interés, por lo que puedes abonar el total en cualquier momento sin cargos adicionales.
        `,
        "Préstamo en Dólares (para proyectos o dominicanos en el exterior)": `
            💵 Las condiciones para abonos anticipados pueden variar según el tipo de préstamo en dólares. Generalmente permiten abonos con penalización del 2-3% durante los primeros años. Consulta con tu asesor bancario para detalles específicos.
        `,
        "Préstamo Comercial / Empresarial": `
            🏢 Los préstamos comerciales suelen permitir abonos anticipados con penalización del 2-3% durante los primeros 1-3 años. Después de ese periodo, puedes abonar sin penalización. Verifica las condiciones específicas de tu contrato.
        `
    };

    // Manejar cambio de banco
    const bancoSelect = document.getElementById('banco');
    const tipoPrestamoSelect = document.getElementById('tipo_prestamo');
    const infoPrestamoDiv = document.getElementById('infoPrestamo');

    if (bancoSelect) {
        bancoSelect.addEventListener('change', function() {
            const banco = this.value;
            tipoPrestamoSelect.innerHTML = '<option value="" selected disabled>Selecciona un tipo de préstamo</option>';
            
            if (banco && TIPOS_PRESTAMO[banco]) {
                tipoPrestamoSelect.disabled = false;
                TIPOS_PRESTAMO[banco].forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo;
                    option.textContent = tipo;
                    tipoPrestamoSelect.appendChild(option);
                });
            } else {
                tipoPrestamoSelect.disabled = true;
                infoPrestamoDiv.textContent = 'Selecciona un banco y tipo de préstamo para ver información específica.';
            }
        });
    }

    // Manejar cambio de tipo de préstamo
    if (tipoPrestamoSelect) {
        tipoPrestamoSelect.addEventListener('change', function() {
            const tipo = this.value;
            if (tipo && INFO_PRESTAMOS[tipo]) {
                infoPrestamoDiv.innerHTML = INFO_PRESTAMOS[tipo];
            } else {
                infoPrestamoDiv.textContent = 'Selecciona un banco y tipo de préstamo para ver información específica.';
            }
        });
    }

    // Manejar cambio de tipo de abono
    const tipoAbonoSelect = document.getElementById('tipoAbono');
    const abonosContainer = document.getElementById('abonosContainer');

    if (tipoAbonoSelect) {
        tipoAbonoSelect.addEventListener('change', function() {
            updateAbonosFields(this.value);
        });
    }

    function updateAbonosFields(tipo) {
        if (!abonosContainer) return;
        
        abonosContainer.innerHTML = '';
        
        if (tipo === 'personalizado') {
            const div = document.createElement('div');
            div.className = 'mb-3';
            
            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = 'Número de Abonos Extra';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control';
            input.id = 'numAbonos';
            input.value = '1';
            input.min = '1';
            
            const abonosDiv = document.createElement('div');
            abonosDiv.id = 'abonosFields';
            abonosDiv.className = 'mt-3';
            
            div.appendChild(label);
            div.appendChild(input);
            abonosContainer.appendChild(div);
            abonosContainer.appendChild(abonosDiv);
            
            input.addEventListener('input', function() {
                generateAbonosFields(parseInt(this.value) || 0);
            });
            
            generateAbonosFields(1);
        } else if (tipo === 'mensual') {
            const div = document.createElement('div');
            div.className = 'mb-3';
            
            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = 'Monto del Abono Mensual (RD$)';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control';
            input.id = 'abonoMensual';
            input.step = '0.01';
            input.min = '0';
            input.required = true;
            
            div.appendChild(label);
            div.appendChild(input);
            abonosContainer.appendChild(div);
        } else if (tipo === 'cada_n') {
            const div1 = document.createElement('div');
            div1.className = 'mb-3';
            
            const label1 = document.createElement('label');
            label1.className = 'form-label';
            label1.textContent = 'Monto del Abono (RD$)';
            
            const input1 = document.createElement('input');
            input1.type = 'number';
            input1.className = 'form-control';
            input1.id = 'abonoCadaNMonto';
            input1.step = '0.01';
            input1.min = '0';
            input1.required = true;
            
            div1.appendChild(label1);
            div1.appendChild(input1);
            
            const div2 = document.createElement('div');
            div2.className = 'mb-3';
            
            const label2 = document.createElement('label');
            label2.className = 'form-label';
            label2.textContent = 'Cada cuántos meses';
            
            const input2 = document.createElement('input');
            input2.type = 'number';
            input2.className = 'form-control';
            input2.id = 'abonoCadaNN';
            input2.min = '1';
            input2.required = true;
            
            div2.appendChild(label2);
            div2.appendChild(input2);
            
            abonosContainer.appendChild(div1);
            abonosContainer.appendChild(div2);
        }
    }

// En la función generateAbonosFields, modificaremos para mantener los valores
function generateAbonosFields(num) {
    const abonosFields = document.getElementById('abonosFields');
    if (!abonosFields) return;
    
    // Guardar los valores actuales antes de regenerar
    const currentValues = [];
    for (let i = 1; i <= 100; i++) { // Asumimos un máximo razonable
        const mesInput = document.getElementById(`abonoCuota_${i}`);
        const montoInput = document.getElementById(`abonoMonto_${i}`);
        if (mesInput && montoInput) {
            currentValues.push({
                mes: mesInput.value,
                monto: montoInput.value
            });
        } else {
            break;
        }
    }
    
    abonosFields.innerHTML = '';
    
    for (let i = 1; i <= num; i++) {
        const div = document.createElement('div');
        div.className = 'row mb-2';
        
        const div1 = document.createElement('div');
        div1.className = 'col-md-6';
        
        const label1 = document.createElement('label');
        label1.className = 'form-label';
        label1.textContent = `Mes del Abono ${i}`;
        
        const input1 = document.createElement('input');
        input1.type = 'number';
        input1.className = 'form-control';
        input1.id = `abonoCuota_${i}`;
        input1.min = '1';
        input1.required = true;
        
        // Restaurar valor si existe
        if (currentValues[i-1]) {
            input1.value = currentValues[i-1].mes;
        }
        
        div1.appendChild(label1);
        div1.appendChild(input1);
        
        const div2 = document.createElement('div');
        div2.className = 'col-md-6';
        
        const label2 = document.createElement('label');
        label2.className = 'form-label';
        label2.textContent = `Monto (RD$) ${i}`;
        
        const input2 = document.createElement('input');
        input2.type = 'text'; // Cambiado a text para permitir formato
        input2.className = 'form-control abono-monto-input';
        input2.id = `abonoMonto_${i}`;
        input2.min = '0';
        input2.required = true;
        
        // Restaurar valor si existe
        if (currentValues[i-1]) {
            input2.value = currentValues[i-1].monto;
        }
        
        // Aplicar formato de moneda al input de monto
        input2.addEventListener('input', function(e) {
            formatCurrencyInput(e.target);
        });
        
        input2.addEventListener('blur', function(e) {
            formatCurrencyInput(e.target, true);
        });
        
        div2.appendChild(label2);
        div2.appendChild(input2);
        
        div.appendChild(div1);
        div.appendChild(div2);
        abonosFields.appendChild(div);
    }
}

// Función para formatear inputs de moneda
function formatCurrencyInput(input, blur = false) {
    // Obtener el valor sin comas ni caracteres no numéricos excepto punto decimal
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Eliminar puntos decimales adicionales
    const decimalParts = value.split('.');
    if (decimalParts.length > 2) {
        value = decimalParts[0] + '.' + decimalParts.slice(1).join('');
    }
    
    // Separar parte entera y decimal
    const parts = value.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    
    // Agregar comas a la parte entera
    if (integerPart.length > 3) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Combinar y actualizar el valor
    input.value = integerPart + decimalPart;
    
    // Al perder el foco, asegurar el formato correcto con 2 decimales
    if (blur) {
        let numericValue = parseFloat(value.replace(/,/g, ''));
        if (isNaN(numericValue)) numericValue = 0;
        input.value = numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

    // Función para calcular la amortización
    function calcularAmortizacion(monto, tasa, plazo, abonosExtra = {}) {
        let saldo = parseFloat(monto);
        const tasaMensual = parseFloat(tasa) / 12 / 100;
        const cuota = (saldo * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazo));
        const tabla = [];
        let totalIntereses = 0;
        let totalAbonadoExtra = 0;
        let plazoReal = plazo;

        for (let mes = 1; mes <= plazo; mes++) {
            const interes = saldo * tasaMensual;
            const abonoCapital = cuota - interes;
            const abonoExtra = abonosExtra[mes] || 0;
            
            saldo -= (abonoCapital + abonoExtra);
            if (saldo < 0) saldo = 0;
            
            totalIntereses += interes;
            totalAbonadoExtra += abonoExtra;
            
            tabla.push({
                mes,
                cuota,
                interes,
                abonoCapital,
                abonoExtra,
                saldoRestante: saldo
            });
            
            if (saldo <= 0) {
                plazoReal = mes;
                break;
            }
        }

        return {
            tabla,
            totalIntereses,
            plazoReal,
            totalAbonadoExtra,
            cuota
        };
    }

    // Manejar envío del formulario
    const prestamoForm = document.getElementById('prestamoForm');
    const resultadosDiv = document.getElementById('resultados');
    const limpiarBtn = document.getElementById('limpiarBtn');

if (prestamoForm) {
    prestamoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Función auxiliar para limpiar valores monetarios
        function cleanCurrencyValue(value) {
            if (typeof value === 'string') {
                return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
            }
            return value;
        }
        
        // Validar campos requeridos
        const monto = cleanCurrencyValue(document.getElementById('monto').value);
        const tasa = parseFloat(document.getElementById('tasa').value);
        const plazo = parseInt(document.getElementById('plazo').value);
        
        if (isNaN(monto) || isNaN(tasa) || isNaN(plazo)) {
            alert('Por favor complete todos los campos requeridos correctamente.');
            return;
        }
        
        const tipoAbono = document.getElementById('tipoAbono').value;
        
        // Obtener abonos extra según el tipo seleccionado
        let abonosExtra = {};
        
        if (tipoAbono === 'personalizado') {
            const numAbonos = parseInt(document.getElementById('numAbonos').value) || 0;
            for (let i = 1; i <= numAbonos; i++) {
                const mesInput = document.getElementById(`abonoCuota_${i}`);
                const montoInput = document.getElementById(`abonoMonto_${i}`);
                
                if (mesInput && montoInput) {
                    const mes = parseInt(mesInput.value);
                    const montoAbono = cleanCurrencyValue(montoInput.value);
                    if (mes && montoAbono) {
                        abonosExtra[mes] = montoAbono;
                    }
                }
            }
        } else if (tipoAbono === 'mensual') {
            const montoMensual = cleanCurrencyValue(document.getElementById('abonoMensual').value);
            if (montoMensual) {
                for (let mes = 1; mes <= plazo; mes++) {
                    abonosExtra[mes] = montoMensual;
                }
            }
        } else if (tipoAbono === 'cada_n') {
            const montoAbono = cleanCurrencyValue(document.getElementById('abonoCadaNMonto').value);
            const n = parseInt(document.getElementById('abonoCadaNN').value) || 1;
            if (montoAbono && n) {
                for (let mes = 1; mes <= plazo; mes++) {
                    if (mes % n === 0) {
                        abonosExtra[mes] = montoAbono;
                    }
                }
            }
        }
            
            try {
                // Calcular con abonos extra
                const resultadoConAbonos = calcularAmortizacion(monto, tasa, plazo, abonosExtra);
                
                // Calcular sin abonos extra (plan original)
                const resultadoSinAbonos = calcularAmortizacion(monto, tasa, plazo);
                
                // Calcular ahorros
                const ahorro = resultadoSinAbonos.totalIntereses - resultadoConAbonos.totalIntereses;
                const reduccionMeses = resultadoSinAbonos.plazoReal - resultadoConAbonos.plazoReal;
                
                // Mostrar resultados
                document.getElementById('totalIntereses').textContent = formatCurrency(resultadoConAbonos.totalIntereses);
                document.getElementById('plazoFinal').textContent = `${resultadoConAbonos.plazoReal} meses`;
                document.getElementById('totalAbonado').textContent = formatCurrency(resultadoConAbonos.totalAbonadoExtra);
                document.getElementById('totalPagado').textContent = formatCurrency(
                    (resultadoConAbonos.cuota * resultadoConAbonos.plazoReal) + resultadoConAbonos.totalAbonadoExtra
                );
                
                document.getElementById('ahorro').textContent = formatCurrency(ahorro);
                document.getElementById('mesesReducidos').textContent = `${reduccionMeses} meses`;
                document.getElementById('totalPagadoOriginal').textContent = formatCurrency(
                    resultadoSinAbonos.cuota * resultadoSinAbonos.plazoReal
                );
                
                // Generar tabla de amortización
                const tablaAmortizacion = document.getElementById('tablaAmortizacion');
                if (tablaAmortizacion) {
                    tablaAmortizacion.innerHTML = '';
                    
                    resultadoConAbonos.tabla.forEach(fila => {
                        const tr = document.createElement('tr');
                        
                        const tdMes = document.createElement('td');
                        tdMes.textContent = fila.mes;
                        
                        const tdCuota = document.createElement('td');
                        tdCuota.textContent = formatCurrency(fila.cuota);
                        
                        const tdInteres = document.createElement('td');
                        tdInteres.textContent = formatCurrency(fila.interes);
                        
                        const tdAbonoCapital = document.createElement('td');
                        tdAbonoCapital.textContent = formatCurrency(fila.abonoCapital);
                        
                        const tdAbonoExtra = document.createElement('td');
                        tdAbonoExtra.textContent = formatCurrency(fila.abonoExtra);
                        
                        const tdSaldo = document.createElement('td');
                        tdSaldo.textContent = formatCurrency(fila.saldoRestante);
                        
                        tr.appendChild(tdMes);
                        tr.appendChild(tdCuota);
                        tr.appendChild(tdInteres);
                        tr.appendChild(tdAbonoCapital);
                        tr.appendChild(tdAbonoExtra);
                        tr.appendChild(tdSaldo);
                        
                        tablaAmortizacion.appendChild(tr);
                    });
                }
                
                if (resultadosDiv) {
                    resultadosDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Error al calcular la amortización:', error);
                alert('Ocurrió un error al calcular la amortización. Por favor verifique los datos ingresados.');
            }
        });
    }

    // Función para formatear moneda
    function formatCurrency(value) {
        if (isNaN(value)) return '0';
        // Redondea a 2 decimales y formatea con comas
        const rounded = Math.round(value * 100) / 100;
        return rounded.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Manejar botón limpiar
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', function() {
            if (prestamoForm) prestamoForm.reset();
            if (resultadosDiv) resultadosDiv.style.display = 'none';
            if (tipoPrestamoSelect) {
                tipoPrestamoSelect.innerHTML = '<option value="" selected disabled>Primero selecciona un banco</option>';
                tipoPrestamoSelect.disabled = true;
            }
            if (infoPrestamoDiv) {
                infoPrestamoDiv.textContent = 'Selecciona un banco y tipo de préstamo para ver información específica.';
            }
            updateAbonosFields('personalizado');
        });
    }

    // Inicializar campos de abonos
    updateAbonosFields('personalizado');
});
