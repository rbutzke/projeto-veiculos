import { Component, OnInit } from '@angular/core';
import { Vehicle, VehicleResponse } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css']
})
export class VehicleListComponent implements OnInit {
  vehicle: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  isLoading = true;
  error = '';
  
  // Paginação
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Filtros
  searchTerm = '';
  sortBy = 'createdAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  
  // Modal
  showModal = false;
  selectedVehicle: Vehicle | null = null;
  modalMode: 'view' | 'edit' | 'create' = 'view';
  
  // Para o campo ano
  currentYear = new Date().getFullYear();
  maxYear = this.currentYear + 1;
  years: number[] = [];
  
  // Formulário
  formVehicle: Partial<Vehicle> = {
    placa: '',
    chassi: '',
    renavam: '',
    modelo: '',
    marca: '',
    //ano: new Date().getFullYear()
    ano: 2025
  };

  constructor(private vehicleService: VehicleService,private authService: AuthService) {}

  ngOnInit(): void {
    // PRIMEIRO: Faz o login
    this.loginVehicles();
    this.loadVehicles();
    this.generateYearOptions();
  }

  generateYearOptions(): void {
    const startYear = 1900;
    for (let year = this.currentYear + 1; year >= startYear; year--) {
      this.years.push(year);
    }
  }

  loginVehicles() {
      console.log(`🔑 Tentativa de login...`);
      this.authService.login().subscribe({
      next: (loginResponse) => {
        console.log('✅ Login realizado com sucesso!');
        //console.log('Token recebido:', loginResponse.access_token.substring(0, 30) + '...');
        
        // PASSO 2: Depois do login, carrega os veículos
        this.loadVehicles();
      },
    });
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.error = '';
    
    this.vehicleService.getAllVehicles(
      this.currentPage,
      this.itemsPerPage,
      this.sortBy,
      this.sortOrder
    ).subscribe({
      next: (response: VehicleResponse) => {
        this.vehicle = response.vehicles;
        this.filteredVehicles = [...this.vehicle];
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar veículos. Tente novamente mais tarde.';
        console.error('Erro:', err);
        this.isLoading = false;
      }
    });
  }

  searchVehicles(): void {
    if (!this.searchTerm.trim()) {
      this.filteredVehicles = [...this.vehicle];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredVehicles = this.vehicle.filter(vehicle =>
      vehicle.placa.toLowerCase().includes(term) ||
      vehicle.chassi.toLowerCase().includes(term) ||
      vehicle.renavam.toLowerCase().includes(term) ||
      vehicle.modelo.toLowerCase().includes(term) ||
      vehicle.marca.toLowerCase().includes(term) ||
      vehicle.ano.toString().includes(term)
    );
  }

  sortVehicles(field: keyof Vehicle): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    
    this.loadVehicles();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadVehicles();
    }
  }

  viewVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.modalMode = 'view';
    this.showModal = true;
  }

  editVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.formVehicle = { ...vehicle };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  createVehicle(): void {
    this.selectedVehicle = null;
    this.formVehicle = {
      placa: '',
      chassi: '',
      renavam: '',
      modelo: '',
      marca: '',
      ano: new Date().getFullYear()
    };
    this.modalMode = 'create';
    this.showModal = true;
  }

saveVehicle(): void {
  if (this.modalMode === 'create') {
    this.vehicleService.createVehicle(this.formVehicle as any).subscribe({
      next: () => {
        this.closeModal(); // Fecha a modal
        this.loadVehicles(); // Recarrega a lista
      },
      error: (err) => {
        this.error = 'Erro ao criar veículo. Tente novamente.';
        console.error('Erro ao criar veículo:', err);
      }
    });
  } else if (this.modalMode === 'edit' && this.selectedVehicle) {
    this.vehicleService.updateVehicle(this.selectedVehicle.id, this.formVehicle).subscribe({
      next: () => {
        this.closeModal(); // Fecha a modal
        this.loadVehicles(); // Recarrega a lista
      },
      error: (err) => {
        this.error = 'Erro ao atualizar veículo. Tente novamente.';
        console.error('Erro ao atualizar veículo:', err);
      }
    });
  }
}

  deleteVehicle(id: number): void {
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
      this.vehicleService.deleteVehicle(id).subscribe({
        next: () => {
          this.loadVehicles();
        },
        error: (err) => {
          this.error = 'Erro ao excluir veículo. Tente novamente.';
          console.error('Erro ao excluir veículo:', err);
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedVehicle = null;
  }

  get paginationArray(): number[] {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: Date | string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR');
  }
}