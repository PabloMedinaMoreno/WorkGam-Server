-- Insertar roles que se usan en las tareas
INSERT INTO role (name, description) VALUES
  ('Gestor de Solicitudes', 'Encargado de gestionar las solicitudes y documentos administrativos.'),
  ('Revisor Legal', 'Encargado de revisar los aspectos legales de los procedimientos, como antecedentes y formularios legales.'),
  ('Inspector Técnico', 'Responsable de realizar inspecciones técnicas y verificar la infraestructura de los negocios.'),
  ('Auditor Financiero', 'Encargado de revisar los aspectos financieros de los procedimientos, como evaluaciones financieras y planes de negocio.'),
  ('Consultor de Negocios', 'Especialista en planes de negocio, encargado de revisar y validar los planes de negocio adjuntos.'),
  ('Asesor Legal', 'Revisa y verifica documentos legales, como certificados de antecedentes legales y declaraciones juradas.'),
  ('Gestor de Subvenciones', 'Gestión de las solicitudes de subvención, revisando los documentos asociados como planes de negocio y evaluaciones financieras.');


-- Insertar procedimientos
INSERT INTO procedure (name, description) VALUES
  ('Registro de Empresa', 'Trámite para registrar una nueva empresa en el sistema.'),
  ('Solicitud de Licencia Comercial', 'Trámite para obtener una licencia comercial que permita operar un negocio.'),
  ('Renovación de Licencia Comercial', 'Proceso para renovar una licencia comercial existente y asegurar su validez.'),
  ('Solicitud de Subvención', 'Trámite para solicitar una subvención destinada a proyectos comerciales específicos.'),
  ('Cambio de Titularidad', 'Proceso para actualizar la titularidad de un registro de empresa o licencia comercial.'),
  ('Registro Sanitario', 'Proceso para obtener un registro sanitario necesario para la comercialización de productos que requieren control sanitario.'),
  ('Autorización de Funcionamiento', 'Trámite para obtener una autorización oficial de funcionamiento para operar un nuevo local comercial.');


-- Procedimiento 1: Registro de Empresa
INSERT INTO task (name, description, xp, procedure_id, role_id, estimated_duration_days, difficulty) VALUES
('Formulario de solicitud completo', 'Debe adjuntar el documento: formulario de solicitud completo.', 50, 1, (SELECT id FROM role WHERE name = 'Gestor de Solicitudes'), 3, 'easy'),
('Copia del documento de identidad', 'Debe adjuntar el documento: copia del documento de identidad.', 50, 1, (SELECT id FROM role WHERE name = 'Revisor Legal'), 4, 'easy'),
('Certificado de antecedentes legales', 'Debe adjuntar el documento: certificado de antecedentes legales.', 60, 1, (SELECT id FROM role WHERE name = 'Revisor Legal'), 5, 'medium'),
('Plan de negocio adjunto', 'Debe adjuntar el documento: plan de negocio adjunto.', 70, 1, (SELECT id FROM role WHERE name = 'Consultor de Negocios'), 3, 'hard'),

-- Procedimiento 2: Solicitud de Licencia Comercial
('Copia del documento de identidad', 'Debe adjuntar el documento: copia del documento de identidad.', 50, 2, (SELECT id FROM role WHERE name = 'Revisor Legal'), 3, 'easy'),
('Certificado de antecedentes legales', 'Debe adjuntar el documento: certificado de antecedentes legales.', 60, 2, (SELECT id FROM role WHERE name = 'Revisor Legal'), 4, 'medium'),
('Plan de negocio adjunto', 'Debe adjuntar el documento: plan de negocio adjunto.', 70, 2, (SELECT id FROM role WHERE name = 'Consultor de Negocios'), 5, 'hard'),
('Informe técnico de instalaciones', 'Debe adjuntar el documento: informe técnico de instalaciones.', 60, 2, (SELECT id FROM role WHERE name = 'Inspector Técnico'), 4, 'medium'),

-- Procedimiento 3: Renovación de Licencia Comercial
('Formulario de solicitud completo', 'Debe adjuntar el documento: formulario de solicitud completo.', 50, 3, (SELECT id FROM role WHERE name = 'Gestor de Solicitudes'), 3, 'easy'),
('Declaración jurada firmada', 'Debe adjuntar el documento: declaración jurada firmada.', 50, 3, (SELECT id FROM role WHERE name = 'Revisor Legal'), 4, 'easy'),
('Comprobante de pago', 'Debe adjuntar el documento: comprobante de pago.', 50, 3, (SELECT id FROM role WHERE name = 'Gestor de Solicitudes'), 3, 'easy'),
('Informe técnico de instalaciones', 'Debe adjuntar el documento: informe técnico de instalaciones.', 60, 3, (SELECT id FROM role WHERE name = 'Inspector Técnico'), 5, 'medium'),

-- Procedimiento 4: Solicitud de Subvención
('Plan de negocio adjunto', 'Debe adjuntar el documento: plan de negocio adjunto.', 70, 4, (SELECT id FROM role WHERE name = 'Consultor de Negocios'), 4, 'hard'),
('Evaluación financiera adjunta', 'Debe adjuntar el documento: evaluación financiera adjunta.', 70, 4, (SELECT id FROM role WHERE name = 'Auditor Financiero'), 3, 'hard'),
('Certificado de antecedentes legales', 'Debe adjuntar el documento: certificado de antecedentes legales.', 60, 4, (SELECT id FROM role WHERE name = 'Revisor Legal'), 3, 'medium'),
('Formulario de solicitud completo', 'Debe adjuntar el documento: formulario de solicitud completo.', 50, 4, (SELECT id FROM role WHERE name = 'Gestor de Solicitudes'), 3, 'easy'),

-- Procedimiento 5: Cambio de Titularidad
('Copia del documento de identidad', 'Debe adjuntar el documento: copia del documento de identidad.', 50, 5, (SELECT id FROM role WHERE name = 'Revisor Legal'), 4, 'easy'),
('Declaración jurada firmada', 'Debe adjuntar el documento: declaración jurada firmada.', 50, 5, (SELECT id FROM role WHERE name = 'Revisor Legal'), 3, 'easy'),
('Comprobante de pago', 'Debe adjuntar el documento: comprobante de pago.', 50, 5, (SELECT id FROM role WHERE name = 'Gestor de Solicitudes'), 4, 'easy'),
('Plan de negocio adjunto', 'Debe adjuntar el documento: plan de negocio adjunto.', 70, 5, (SELECT id FROM role WHERE name = 'Consultor de Negocios'), 5, 'hard'),

-- Procedimiento 6: Registro Sanitario
('Formulario de solicitud completo', 'Debe adjuntar el documento: formulario de solicitud completo.', 50, 6, (SELECT id FROM role WHERE name = 'Gestor de Solicitudes'), 3, 'easy'),
('Informe técnico de instalaciones', 'Debe adjuntar el documento: informe técnico de instalaciones.', 60, 6, (SELECT id FROM role WHERE name = 'Inspector Técnico'), 3, 'medium'),
('Evaluación financiera adjunta', 'Debe adjuntar el documento: evaluación financiera adjunta.', 70, 6, (SELECT id FROM role WHERE name = 'Auditor Financiero'), 5, 'hard'),
('Certificado de antecedentes legales', 'Debe adjuntar el documento: certificado de antecedentes legales.', 60, 6, (SELECT id FROM role WHERE name = 'Revisor Legal'), 4, 'medium'),

-- Procedimiento 7: Autorización de Funcionamiento
('Formulario de solicitud completo', 'Debe adjuntar el documento: formulario de solicitud completo.', 50, 7, (SELECT id FROM role WHERE name = 'Gestor de Solicitudes'), 3, 'easy'),
('Copia del documento de identidad', 'Debe adjuntar el documento: copia del documento de identidad.', 50, 7, (SELECT id FROM role WHERE name = 'Revisor Legal'), 4, 'easy'),
('Informe técnico de instalaciones', 'Debe adjuntar el documento: informe técnico de instalaciones.', 60, 7, (SELECT id FROM role WHERE name = 'Inspector Técnico'), 5, 'medium'),
('Declaración jurada firmada', 'Debe adjuntar el documento: declaración jurada firmada.', 50, 7, (SELECT id FROM role WHERE name = 'Revisor Legal'), 4, 'easy');




