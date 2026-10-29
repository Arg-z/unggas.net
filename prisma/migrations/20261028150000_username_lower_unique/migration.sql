-- Username unik tanpa peduli besar-kecil, termasuk saat dua pendaftaran bersamaan.
CREATE UNIQUE INDEX "users_username_lower_key" ON "users" (lower("username"));
