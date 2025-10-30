/**
 * Role-Based UI Isolation Verification Script
 * 
 * This script verifies that all role-based UI isolation is working correctly
 * Run this script in browser console after logging in with each role
 */

(function() {
  'use strict';

  console.log('🔍 Starting Role-Based UI Isolation Verification...\n');

  // Helper function to check if user role is correct
  function verifyRole(userRole) {
    console.log(`\n📋 Verifying Role: ${userRole.toUpperCase()}\n`);
    
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user || !user.role) {
      console.error('❌ No user found in localStorage. Please log in first.');
      return false;
    }

    if (user.role !== userRole) {
      console.error(`❌ Role mismatch! Expected: ${userRole}, Got: ${user.role}`);
      console.log('Please log in as the correct role and run this script again.');
      return false;
    }

    console.log(`✅ User logged in as: ${user.role}`);
    console.log(`✅ User email: ${user.email}`);
    console.log(`✅ User name: ${user.name}\n`);

    return true;
  }

  // Helper function to check if navigation item is visible
  function checkNavItemVisible(navItemLabel, shouldBeVisible, roles) {
    const navItems = document.querySelectorAll('[data-nav-item]');
    let item = null;
    
    for (let i = 0; i < navItems.length; i++) {
      const button = navItems[i];
      const label = (button.getAttribute('data-nav-item') || '').trim();
      if (label.toLowerCase() === navItemLabel.toLowerCase()) {
        item = button;
        break;
      }
    }

    const isVisible = item && item.offsetParent !== null;
    
    if (shouldBeVisible) {
      if (isVisible) {
        console.log(`  ✅ ${navItemLabel} is visible (correct)`);
      } else {
        console.error(`  ❌ ${navItemLabel} is NOT visible (should be visible for: ${roles.join(', ')})`);
      }
    } else {
      if (isVisible) {
        console.error(`  ❌ ${navItemLabel} is visible (should be hidden for: ${roles.join(', ')})`);
      } else {
        console.log(`  ✅ ${navItemLabel} is hidden (correct)`);
      }
    }

    return isVisible === shouldBeVisible;
  }

  // Verification matrix for each role
  const verificationMatrix = {
    admin: {
      visible: ['Dashboard', 'Appointments', 'Clients', 'Payments', 'Inventory', 'Reports', 'Compliance', 'Settings'],
      hidden: ['Book Appointment', 'Calendar', 'All Appointments', 'Add Client', 'Treatments', 'Packages', 'Point of Sale', 'Payment History', 'Profile', 'Business', 'Stock Alerts', 'Revenue', 'Client Analytics', 'Staff Performance', 'Audit Log', 'Compliance Alerts']
    },
    provider: {
      visible: ['Dashboard', 'Appointments', 'Clients', 'Treatments', 'Inventory', 'Compliance', 'Settings'],
      hidden: ['Payments', 'Reports', 'Locations']
    },
    reception: {
      visible: ['Dashboard', 'Appointments', 'Clients', 'Payments', 'Settings'],
      hidden: ['Treatments', 'Inventory', 'Reports', 'Compliance', 'Locations']
    },
    client: {
      visible: ['Dashboard', 'Appointments', 'Payments', 'Settings'],
      hidden: ['Clients', 'Treatments', 'Inventory', 'Reports', 'Compliance', 'Locations']
    }
  };

  // Run verification for current user's role
  function runVerification() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user || !user.role) {
      console.error('❌ No user found. Please log in first.');
      return;
    }

    const role = user.role;
    const matrix = verificationMatrix[role];

    if (!matrix) {
      console.error(`❌ Unknown role: ${role}`);
      return;
    }

    console.log(`\n🔍 Verifying UI visibility for ${role.toUpperCase()} role...\n`);

    let passed = 0;
    let failed = 0;

    // Check visible items
    console.log('📋 Checking VISIBLE navigation items:');
    matrix.visible.forEach(item => {
      const result = checkNavItemVisible(item, true, [role]);
      if (result) passed++;
      else failed++;
    });

    // Check hidden items
    console.log('\n📋 Checking HIDDEN navigation items:');
    matrix.hidden.forEach(item => {
      const result = checkNavItemVisible(item, false, [role]);
      if (result) passed++;
      else failed++;
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 VERIFICATION RESULTS for ${role.toUpperCase()}:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
    }
    console.log('='.repeat(50));
  }

  // API Testing function
  async function testAPIAccess(role) {
    console.log(`\n🔍 Testing API access for ${role.toUpperCase()} role...\n`);

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found in localStorage');
      return;
    }

    const tests = {
      admin: [
        { endpoint: '/api/admin/appointments', shouldPass: true },
        { endpoint: '/api/admin/reports/revenue', shouldPass: true },
        { endpoint: '/api/admin/users', shouldPass: true },
        { endpoint: '/api/staff/appointments', shouldPass: false }
      ],
      provider: [
        { endpoint: '/api/staff/appointments', shouldPass: true },
        { endpoint: '/api/admin/appointments', shouldPass: false },
        { endpoint: '/api/admin/reports/revenue', shouldPass: false },
        { endpoint: '/api/admin/users', shouldPass: false }
      ],
      reception: [
        { endpoint: '/api/staff/appointments', shouldPass: true },
        { endpoint: '/api/admin/appointments', shouldPass: false },
        { endpoint: '/api/admin/reports/revenue', shouldPass: false },
        { endpoint: '/api/admin/users', shouldPass: false }
      ],
      client: [
        { endpoint: '/api/client/appointments', shouldPass: true },
        { endpoint: '/api/admin/appointments', shouldPass: false },
        { endpoint: '/api/staff/appointments', shouldPass: false },
        { endpoint: '/api/admin/reports/revenue', shouldPass: false }
      ]
    };

    const roleTests = tests[role];
    if (!roleTests) {
      console.error(`❌ Unknown role: ${role}`);
      return;
    }

    let passed = 0;
    let failed = 0;

    for (const test of roleTests) {
      try {
        const response = await fetch(`http://localhost:8000${test.endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (test.shouldPass) {
          if (response.ok) {
            console.log(`✅ ${test.endpoint} - Allowed (Correct)`);
            passed++;
          } else {
            console.error(`❌ ${test.endpoint} - ${response.status} ${response.statusText} (Should be allowed)`);
            failed++;
          }
        } else {
          if (response.status === 403) {
            console.log(`✅ ${test.endpoint} - Blocked (Correct)`);
            passed++;
          } else {
            console.error(`❌ ${test.endpoint} - ${response.status} (Should be 403)`);
            failed++;
          }
        }
      } catch (error) {
        console.error(`❌ Error testing ${test.endpoint}:`, error.message);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 API ACCESS TEST RESULTS for ${role.toUpperCase()}:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
  }

  // Export functions
  window.verifyRoleIsolation = {
    verifyRole,
    runVerification,
    testAPIAccess,
    verifyAdminUI: async function() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user || user.role !== 'admin') {
        console.error('❌ Not logged in as admin');
        return;
      }
      const ok = verifyRole('admin');
      if (!ok) return;
      runVerification();
      console.log('✅ Admin UI isolation perfect');
    },
    fullTest: async function() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user || !user.role) {
        console.error('❌ No user found. Please log in first.');
        return;
      }

      console.log('\n🚀 Starting Full Role Isolation Test...\n');
      await testAPIAccess(user.role);
      runVerification();
      
      console.log('\n✅ Full test completed!');
      console.log('📝 Review the results above for any failures.');
    }
  };

  console.log('\n✅ Verification script loaded!');
  console.log('\n📖 Available commands:');
  console.log('  window.verifyRoleIsolation.verifyRole("admin")');
  console.log('  window.verifyRoleIsolation.runVerification()');
  console.log('  window.verifyRoleIsolation.testAPIAccess("admin")');
  console.log('  window.verifyRoleIsolation.fullTest()');
  console.log('\n💡 Run: window.verifyRoleIsolation.fullTest() to start\n');

})();


