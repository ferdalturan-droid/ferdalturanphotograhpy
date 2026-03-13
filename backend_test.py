import requests
import sys
import json
from datetime import datetime

class AdminFeatureTester:
    def __init__(self, base_url="https://quick-code-build.preview.emergentagent.com"):
        self.base_url = base_url + "/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if not headers:
            headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED")
                return True, response.json() if response.content else {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append(f"{name}: Exception - {str(e)}")
            return False, {}

    def test_plads_management(self):
        """Test plads endpoints"""
        print("\n" + "="*60)
        print("TESTING PLADS MANAGEMENT ENDPOINTS")
        print("="*60)
        
        # Test get plads list
        success, plads_list = self.run_test(
            "Get plads list",
            "GET",
            "plads",
            200
        )
        
        if success:
            print(f"   Found {len(plads_list)} plads in the system")
        
        # Test add new plads
        test_plads_name = f"TestPlads_{datetime.now().strftime('%H%M%S')}"
        success, new_plads = self.run_test(
            "Add new plads",
            "POST", 
            "plads",
            200,
            data={"name": test_plads_name}
        )
        
        plads_id = None
        if success and new_plads:
            plads_id = new_plads.get('id')
            print(f"   Created plads with ID: {plads_id}")
        
        # Test duplicate plads (should fail)
        self.run_test(
            "Add duplicate plads (should fail)",
            "POST",
            "plads", 
            400,
            data={"name": test_plads_name}
        )
        
        # Test delete plads
        if plads_id:
            self.run_test(
                "Delete plads",
                "DELETE",
                f"plads/{plads_id}",
                200
            )
        
        return success

    def test_history_endpoint(self):
        """Test report history endpoint"""
        print("\n" + "="*60)
        print("TESTING HISTORY ENDPOINT")
        print("="*60)
        
        # Test get last 30 days history
        success, history = self.run_test(
            "Get report history (30 days)",
            "GET",
            "reports/history?days=30",
            200
        )
        
        if success:
            print(f"   Found {len(history)} days in history")
            if len(history) > 0:
                first_day = history[0]
                print(f"   Latest day: {first_day.get('date')} - {first_day.get('total_tours')} tours")
        
        # Test get last 7 days history  
        success, week_history = self.run_test(
            "Get report history (7 days)",
            "GET", 
            "reports/history?days=7",
            200
        )
        
        if success:
            print(f"   Found {len(week_history)} days in last week")
            
        return success

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        print("\n" + "="*60)
        print("TESTING ADMIN STATS ENDPOINT")
        print("="*60)
        
        success, stats = self.run_test(
            "Get admin stats",
            "GET",
            "admin/stats", 
            200
        )
        
        if success:
            print(f"   Found stats for {len(stats)} drivers")
            for driver in stats[:3]:  # Show first 3 drivers
                print(f"   - {driver.get('driver_name')}: {driver.get('total_tours')} total tours, {driver.get('completed_tours')} completed")
        
        return success

    def test_admin_login(self):
        """Test admin login functionality"""
        print("\n" + "="*60)
        print("TESTING ADMIN LOGIN")
        print("="*60)
        
        # Test valid login
        success, response = self.run_test(
            "Admin login (valid credentials)",
            "POST",
            "admin/login",
            200,
            data={"username": "admin", "password": "ilkaps"}
        )
        
        if success:
            print(f"   Login successful: {response}")
        
        # Test invalid login
        self.run_test(
            "Admin login (invalid credentials)",
            "POST", 
            "admin/login",
            401,
            data={"username": "wrong", "password": "wrong"}
        )
        
        return success

    def test_drivers_endpoint(self):
        """Test drivers endpoint for basic functionality"""
        print("\n" + "="*60)
        print("TESTING DRIVERS ENDPOINT (Basic)")
        print("="*60)
        
        success, drivers = self.run_test(
            "Get drivers list",
            "GET",
            "drivers",
            200
        )
        
        if success:
            print(f"   Found {len(drivers)} drivers")
            for driver in drivers[:3]:  # Show first 3
                print(f"   - {driver.get('name')} ({driver.get('plate')}) - {driver.get('area')}")
        
        return success

    def test_messages_endpoint(self):
        """Test message endpoints"""
        print("\n" + "="*60)
        print("TESTING MESSAGES ENDPOINT")
        print("="*60)
        
        # First get a driver to send message to
        success, drivers = self.run_test(
            "Get drivers for message test",
            "GET", 
            "drivers",
            200
        )
        
        if not success or not drivers:
            print("   Cannot test messages - no drivers found")
            return False
        
        driver_id = drivers[0]['id']
        
        # Test get messages  
        success, messages = self.run_test(
            "Get messages",
            "GET",
            "messages",
            200
        )
        
        if success:
            print(f"   Found {len(messages)} messages")
        
        # Test create message
        success, new_msg = self.run_test(
            "Create message",
            "POST",
            "messages", 
            200,
            data={"to_driver_id": driver_id, "content": "Test message from backend test"}
        )
        
        message_id = None
        if success and new_msg:
            message_id = new_msg.get('id')
            print(f"   Created message with ID: {message_id}")
        
        # Test mark message as read
        if message_id:
            self.run_test(
                "Mark message as read",
                "PUT",
                f"messages/{message_id}/read",
                200
            )
            
            # Test delete message
            self.run_test(
                "Delete message", 
                "DELETE",
                f"messages/{message_id}",
                200
            )
        
        return success

def main():
    print("🚀 Starting Admin Feature Backend Tests")
    print("="*80)
    
    tester = AdminFeatureTester()
    
    # Run all tests
    test_results = []
    
    test_results.append(("Admin Login", tester.test_admin_login()))
    test_results.append(("Drivers Endpoint", tester.test_drivers_endpoint()))
    test_results.append(("Plads Management", tester.test_plads_management()))
    test_results.append(("History Endpoint", tester.test_history_endpoint()))
    test_results.append(("Admin Stats", tester.test_admin_stats()))
    test_results.append(("Messages", tester.test_messages_endpoint()))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_categories = 0
    for test_name, passed in test_results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:20} {status}")
        if passed:
            passed_categories += 1
    
    print(f"\nIndividual Tests: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"Test Categories: {passed_categories}/{len(test_results)} passed")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failed_test in tester.failed_tests:
            print(f"   - {failed_test}")
    
    # Return appropriate exit code
    if passed_categories == len(test_results):
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {len(test_results) - passed_categories} TEST CATEGORIES FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())