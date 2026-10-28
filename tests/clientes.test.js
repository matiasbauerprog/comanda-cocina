import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    matchesSearch, getDirecciones, addDireccion, toClienteRow, suggestGroups, mergeGroup,
} from '../src/lib/clientes.js';

test('matchesSearch ignora mayúsculas y tildes', () => {
    assert.equal(matchesSearch('jose', 'JOSÉ Pérez'), true);
    assert.equal(matchesSearch('marian', 'Mariana casa'), true);
    assert.equal(matchesSearch('perez', null, 'Av. Pérez 12'), true);
    assert.equal(matchesSearch('', 'lo que sea'), true);
    assert.equal(matchesSearch('flan', 'Milanesa'), false);
});

test('getDirecciones usa la columna vieja si no hay lista', () => {
    assert.deepEqual(getDirecciones({ direccion: 'Calle 1', direcciones: [] }), [{ etiqueta: '', direccion: 'Calle 1' }]);
    assert.deepEqual(getDirecciones({ direccion: 'Calle 1' }), [{ etiqueta: '', direccion: 'Calle 1' }]);
    assert.deepEqual(getDirecciones({ direccion: '' }), []);
    const lista = [{ etiqueta: 'Casa', direccion: 'Calle 2' }];
    assert.deepEqual(getDirecciones({ direccion: 'Calle 1', direcciones: lista }), lista);
});

test('addDireccion no duplica direcciones escritas distinto', () => {
    const dirs = [{ etiqueta: 'Casa', direccion: 'Av. Siempreviva 742' }];
    assert.equal(addDireccion(dirs, ' av. siempreviva  742').length, 1);
    assert.equal(addDireccion(dirs, '').length, 1);
    assert.deepEqual(addDireccion(dirs, 'Otra 5').at(-1), { etiqueta: '', direccion: 'Otra 5' });
});

test('toClienteRow sincroniza la columna vieja', () => {
    assert.deepEqual(
        toClienteRow({ nombre: ' Ana ', direcciones: [{ etiqueta: '', direccion: ' ' }, { etiqueta: 'Casa', direccion: 'Calle 1' }] }),
        { nombre: 'Ana', direcciones: [{ etiqueta: 'Casa', direccion: 'Calle 1' }], direccion: 'Calle 1' },
    );
    assert.equal(toClienteRow({ nombre: 'Ana', direcciones: [] }).direccion, '');
});

test('suggestGroups agrupa por primera palabra y respeta descartados', () => {
    const c = [
        { id: 1, nombre: 'Mariana trabajo', created_at: '2026-02-01' },
        { id: 2, nombre: 'mariana Casa', created_at: '2026-01-01' },
        { id: 3, nombre: 'Beto', created_at: '2026-01-01' },
    ];
    const groups = suggestGroups(c, []);
    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].clientes.map(x => x.id), [2, 1]);
    assert.deepEqual(suggestGroups(c, [groups[0].key]), []);
});

test('mergeGroup conserva el más antiguo, etiqueta y deduplica', () => {
    const m = mergeGroup([
        { id: 'b', nombre: 'Mariana trabajo', created_at: '2026-02-01', direccion: 'Oficina 9' },
        { id: 'a', nombre: 'Mariana casa', created_at: '2026-01-01', direccion: 'Calle 1' },
        { id: 'c', nombre: 'Mariana', created_at: '2026-03-01', direccion: 'calle 1 ' },
    ]);
    assert.equal(m.keepId, 'a');
    assert.deepEqual(m.deleteIds, ['b', 'c']);
    assert.equal(m.nombre, 'Mariana');
    assert.deepEqual(m.direcciones, [
        { etiqueta: 'casa', direccion: 'Calle 1' },
        { etiqueta: 'trabajo', direccion: 'Oficina 9' },
    ]);
    assert.deepEqual(m.nombresViejos, ['Mariana casa', 'Mariana trabajo', 'Mariana']);
});
