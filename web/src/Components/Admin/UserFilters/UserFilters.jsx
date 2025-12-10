// web/src/Components/Admin/UserFilters/UserFilters.jsx
import './UserFilters.scss';

function UserFilters({ filters, onFiltersChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFiltersChange(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="user-filters">
      <div className="filter-group">
        <label>ФИО</label>
        <input
          type="text"
          name="name"
          placeholder="Поиск по имени..."
          value={filters.name}
          onChange={handleChange}
        />
      </div>

      <div className="filter-group">
        <label>Роль</label>
        <select name="role" value={filters.role} onChange={handleChange}>
          <option value="">Все роли</option>
          <option value="user">Пользователь</option>
          <option value="admin">Администратор</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Статус</label>
        <select name="status" value={filters.status} onChange={handleChange}>
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="deleted">Удаленные</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Дата от</label>
        <input
          type="date"
          name="dateFrom"
          value={filters.dateFrom}
          onChange={handleChange}
        />
      </div>

      <div className="filter-group">
        <label>Дата до</label>
        <input
          type="date"
          name="dateTo"
          value={filters.dateTo}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

export default UserFilters;