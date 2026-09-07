const $ = (id) => document.getElementById(id);
let token = null;
let user = null;
let products = [];
let cart = new Map();

function toast(msg, ms = 3000) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, { ...opts, headers });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error((data && data.error) || ('Error ' + res.status));
  return data;
}

function money(n) { return '$' + Number(n).toFixed(2); }

function renderAuth() {
  const logged = !!user;
  $('authPanel').classList.toggle('hidden', logged);
  $('logoutBtn').classList.toggle('hidden', !logged);
  $('userLabel').textContent = logged ? user.name + ' (' + user.email + ')' : 'No hay sesión iniciada';
  $('roleTag').classList.toggle('hidden', !logged);
  if (logged) $('roleTag').textContent = user.role;
  loadOrders();
  loadStats();
}

function renderProducts() {
  const grid = $('productGrid');
  if (!products.length) { grid.innerHTML = '<div class="empty">Sin resultados.</div>'; return; }
  grid.innerHTML = products.map((p) => {
    const inCart = cart.get(p.id) || 0;
    return '<div class="product">' +
      '<div class="name">' + esc(p.name) + '</div>' +
      '<div class="desc">' + esc(p.description || '') + '</div>' +
      '<div class="row">' +
        '<span class="price">' + money(p.price) + '</span>' +
        '<span class="stock">' + p.stock + ' en stock</span>' +
      '</div>' +
      '<div class="row">' +
        '<input class="qty" type="number" min="1" max="' + p.stock + '" value="' + (inCart || 1) + '">' +
        '<button class="btn btn-gray add" data-id="' + p.id + '">Agregar</button>' +
      '</div>' +
    '</div>';
  }).join('');
  grid.querySelectorAll('.add').forEach((b) => {
    b.addEventListener('click', () => {
      const qty = parseInt(b.parentElement.querySelector('.qty').value, 10) || 1;
      const p = productById(b.dataset.id);
      addToCart(b.dataset.id, Math.min(qty, p.stock));
    });
  });
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function productById(id) { return products.find((p) => p.id === id); }

function addToCart(id, qty) { cart.set(id, qty); renderCart(); }

function renderCart() {
  const wrap = $('cartItems');
  if (!cart.size) {
    wrap.innerHTML = '<div class="empty">El carrito está vacío.</div>';
    $('cartTotalWrap').classList.add('hidden');
    $('orderBtn').classList.add('hidden');
    return;
  }
  let total = 0;
  wrap.innerHTML = '';
  cart.forEach((qty, id) => {
    const p = productById(id);
    if (!p) return;
    total += Number(p.price) * qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = '<span>' + esc(p.name) + ' x ' + qty + '</span>' +
      '<span class="row"><b>' + money(Number(p.price) * qty) + '</b>' +
      '<button class="btn btn-red" style="padding:2px 8px;font-size:11px" data-id="' + id + '">x</button></span>';
    div.querySelector('button').addEventListener('click', () => { cart.delete(id); renderCart(); });
    wrap.appendChild(div);
  });
  $('cartTotal').textContent = money(total);
  $('cartTotalWrap').classList.remove('hidden');
  $('orderBtn').classList.remove('hidden');
}

async function loadProducts() {
  try {
    const q = $('search').value.trim();
    const sort = $('sortSel').value;
    const res = await api('/products?q=' + encodeURIComponent(q) + '&sort=' + sort + '&order=asc&limit=50');
    products = res.items;
    renderProducts();
  } catch (e) { toast(e.message); }
}

async function loadStats() {
  const card = $('statsCard');
  if (!user || user.role !== 'ADMIN') { card.classList.add('hidden'); return; }
  try {
    const s = await api('/stats');
    $('statRevenue').textContent = money(s.revenue);
    $('statOrders').textContent = s.orders;
    $('statProducts').textContent = s.products;
    $('statUsers').textContent = s.users;
    card.classList.remove('hidden');
  } catch (e) { if (e.message !== 'Authentication required' && e.message !== 'Admin access required') toast(e.message); }
}

async function loadOrders() {
  const list = $('ordersList');
  if (!user) { list.innerHTML = '<div class="empty">Iniciá sesión para ver tus pedidos.</div>'; return; }
  try {
    const res = await api('/orders?limit=50');
    if (!res.items.length) { list.innerHTML = '<div class="empty">Todavía no tenés pedidos.</div>'; return; }
    list.innerHTML = '';
    res.items.forEach((o) => {
      const div = document.createElement('div');
      div.className = 'order';
      const items = o.items.map((i) => esc(i.product.name) + ' x ' + i.quantity).join(', ');
      div.innerHTML =
        '<div class="head"><span>Pedido <b>' + o.id.slice(0, 8) + '...</b></span><span class="badge ' + o.status + '">' + o.status + '</span></div>' +
        '<div class="items">' + items + '</div>' +
        '<div class="head" style="margin-top:6px"><span>Total</span><b>' + money(o.total) + '</b></div>';
      if (o.status === 'PENDING') {
        const b = document.createElement('button');
        b.className = 'btn btn-red'; b.style.cssText = 'margin-top:8px;padding:5px 10px;font-size:12px';
        b.textContent = 'Cancelar pedido';
        b.addEventListener('click', async () => {
          try { await api('/orders/' + o.id + '/cancel', { method: 'PATCH' }); toast('Pedido cancelado, stock devuelto'); loadOrders(); loadStats(); }
          catch (e) { toast(e.message); }
        });
        div.appendChild(b);
      }
      list.appendChild(div);
    });
  } catch (e) { if (e.message !== 'Authentication required' && e.message !== 'Admin access required') toast(e.message); }
}

$('tabLogin').addEventListener('click', () => { $('loginForm').classList.remove('hidden'); $('registerForm').classList.add('hidden'); $('tabLogin').className = 'btn btn-dark'; $('tabRegister').className = 'btn btn-outline'; });
$('tabRegister').addEventListener('click', () => { $('registerForm').classList.remove('hidden'); $('loginForm').classList.add('hidden'); $('tabRegister').className = 'btn btn-dark'; $('tabLogin').className = 'btn btn-outline'; });

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('loginEmail').value, password: $('loginPass').value }) });
    token = res.token; user = res.user;
    renderAuth(); loadProducts();
    toast('Sesión iniciada como ' + user.name);
  } catch (err) { toast(err.message); }
});

$('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: $('regName').value, email: $('regEmail').value, password: $('regPass').value }) });
    toast('Cuenta creada. Ahora inicia sesión.');
    $('regName').value = ''; $('regPass').value = '';
  } catch (err) { toast(err.message); }
});

$('logoutBtn').addEventListener('click', () => { token = null; user = null; cart.clear(); renderAuth(); renderCart(); loadProducts(); toast('Sesión cerrada'); });
$('searchBtn').addEventListener('click', loadProducts);
$('search').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadProducts(); });
$('sortSel').addEventListener('change', loadProducts);

$('orderBtn').addEventListener('click', async () => {
  const items = [...cart.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  try {
    const order = await api('/orders', { method: 'POST', body: JSON.stringify({ items }) });
    cart.clear(); renderCart(); loadOrders(); loadProducts();
    if (user && user.role === 'ADMIN') loadStats();
    toast('Pedido creado, total: ' + money(order.total));
  } catch (e) { toast(e.message); }
});

loadProducts();