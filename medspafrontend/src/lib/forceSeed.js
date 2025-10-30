/**
 * Force seed Reception data utility
 * Can be called from browser console or component
 */
import { fetchWithAuth } from './api';
import { notify } from './toast';

export async function forceSeedReceptionData() {
  try {
    notify.loading('Seeding database...', { duration: 0 });
    
    const response = await fetchWithAuth('/reception/force-seed', {
      method: 'POST',
    });
    
    notify.dismiss();
    
    if (response.seeded_tables && response.seeded_tables.length > 0) {
      notify.success(`Sample data added successfully (${response.seeded_tables.length} tables)`);
      
      console.log('📊 Force Seed Results:');
      console.log('Seeded tables:', response.seeded_tables);
      console.log('Record counts:', response.record_counts);
      
      return response;
    } else {
      notify.info('All tables already have data. No seeding needed.');
      return response;
    }
  } catch (error) {
    notify.dismiss();
    notify.error('Failed to seed database: ' + (error.message || 'Unknown error'));
    console.error('Force seed error:', error);
    throw error;
  }
}

// Auto-expose in window for console access
if (typeof window !== 'undefined') {
  window.forceSeedReception = forceSeedReceptionData;
  console.log('💡 Use window.forceSeedReception() to force-seed database from browser console');
}

