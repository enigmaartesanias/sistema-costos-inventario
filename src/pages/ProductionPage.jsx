import React, { useState } from 'react';
import ProductionForm from '../components/ProductionForm';
import ProductionList from '../components/ProductionList';

export default function ProductionPage() {
    const [editingItem, setEditingItem] = useState(null);
    const [refreshList, setRefreshList] = useState(0);

    const handleSuccess = () => {
        setRefreshList(prev => prev + 1); // Recargar la lista
        setEditingItem(null); // Salir de modo edición
    };

    return (
        <div className="py-8 space-y-8 max-w-5xl mx-auto">
            <ProductionForm
                editingItem={editingItem}
                onSuccess={handleSuccess}
                onCancelEdit={() => setEditingItem(null)}
            />

            <ProductionList
                onEdit={setEditingItem}
                refreshTrigger={refreshList}
            />
        </div>
    );
}
