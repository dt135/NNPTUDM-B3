class ProductDashboard {
    constructor() {
        this.apiUrl = 'https://api.escuelajs.co/api/v1/products';
        this.allProducts = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentSort = { field: null, order: 'asc' };
        this.init();
    }

    init() {
        const loadBtn = document.getElementById('loadProducts');
        const searchInput = document.getElementById('searchInput');
        const pageSizeSelect = document.getElementById('pageSize');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.getAll());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchProducts(e.target.value));
        }
        
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value);
                this.currentPage = 1;
                this.updateDisplay();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }
        
        // Auto load products when page loads
        this.getAll();
    }

    async getAll() {
        const loading = document.getElementById('loading');
        const tableBody = document.getElementById('productTableBody');
        const loadBtn = document.getElementById('loadProducts');

        try {
            // Show loading state
            loading.style.display = 'block';
            loadBtn.disabled = true;
            tableBody.innerHTML = '';

            // Fetch products from API
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const products = await response.json();
            
            // Store all products for search functionality
            this.allProducts = products;
            this.filteredProducts = products;
            this.currentPage = 1;

            // Display products in table
            this.updateDisplay();

        } catch (error) {
            console.error('Error fetching products:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: red;">
                        Error loading products: ${error.message}
                    </td>
                </tr>
            `;
        } finally {
            // Hide loading state
            loading.style.display = 'none';
            loadBtn.disabled = false;
        }
    }

    updateDisplay() {
        this.displayProducts();
        this.updatePagination();
    }

    displayProducts() {
        const tableBody = document.getElementById('productTableBody');
        
        if (this.filteredProducts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">No products found</td>
                </tr>
            `;
            this.updatePaginationInfo(0, 0);
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);

        tableBody.innerHTML = '';

        pageProducts.forEach((product, index) => {
            const row = document.createElement('tr');
            
            // Apply alternating row colors based on overall index
            const overallIndex = startIndex + index;
            if (overallIndex % 2 === 0) {
                row.classList.add('row-white');
            } else {
                row.classList.add('row-black');
            }

            const description = product.description || 'No description';
            const truncatedDesc = this.truncateText(description, 30);
            
            row.innerHTML = `
                <td>${product.id}</td>
                <td>
                    <div class="product-images">
                        ${this.generateProductImages(product)}
                    </div>
                </td>
                <td>
                    <div class="title-with-tooltip" title="${description}">
                        ${product.title}
                        <span class="tooltip-description">${description}</span>
                    </div>
                </td>
                <td>$${product.price}</td>
                <td>${product.category?.name || 'N/A'}</td>
            `;

            tableBody.appendChild(row);
        });
    }

    generateProductImages(product) {
        if (!product.images || product.images.length === 0) {
            return '<img src="https://via.placeholder.com/40" class="product-image-small" alt="No image">';
        }

        const maxImages = 3;
        const imagesToShow = product.images.slice(0, maxImages);
        
        return imagesToShow.map((imageUrl, index) => `
            <img src="${imageUrl}" 
                 alt="${product.title} ${index + 1}" 
                 class="product-image-small"
                 onerror="this.src='https://via.placeholder.com/40'">
        `).join('');
    }

    sortBy(field, order) {
        if (this.allProducts.length === 0) {
            return;
        }

        this.currentSort = { field, order };
        this.currentPage = 1;

        this.filteredProducts.sort((a, b) => {
            let aValue, bValue;

            if (field === 'title') {
                aValue = a.title || '';
                bValue = b.title || '';
            } else if (field === 'price') {
                aValue = a.price || 0;
                bValue = b.price || 0;
            } else {
                return 0;
            }

            let comparison = 0;
            if (typeof aValue === 'string') {
                comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
            } else {
                comparison = aValue - bValue;
            }

            return order === 'asc' ? comparison : -comparison;
        });

        this.updateDisplay();
    }

    async searchProducts(searchTerm) {
        if (this.allProducts.length === 0) {
            await this.getAll();
        }

        if (!searchTerm) {
            this.filteredProducts = [...this.allProducts];
        } else {
            this.filteredProducts = this.allProducts.filter(product => 
                product.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Reapply current sort after filtering
        if (this.currentSort.field) {
            this.sortBy(this.currentSort.field, this.currentSort.order);
        } else {
            this.currentPage = 1;
            this.updateDisplay();
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateDisplay();
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageNumbers = document.getElementById('pageNumbers');

        // Update button states
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }

        // Generate page numbers
        if (pageNumbers) {
            let pageHTML = '';
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                const isActive = i === this.currentPage;
                pageHTML += `<button class="page-number ${isActive ? 'active' : ''}" 
                                   onclick="dashboard.goToPage(${i})">${i}</button>`;
            }

            pageNumbers.innerHTML = pageHTML;
        }

        // Update info
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredProducts.length);
        this.updatePaginationInfo(startIndex, endIndex);
    }

    updatePaginationInfo(start, end) {
        const info = document.getElementById('paginationInfo');
        if (info) {
            if (this.filteredProducts.length === 0) {
                info.textContent = 'Showing 0 of 0 products';
            } else {
                info.textContent = `Showing ${start}-${end} of ${this.filteredProducts.length} products`;
            }
        }
    }

    truncateText(text, maxLength) {
        if (!text) return 'N/A';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new ProductDashboard();
});