#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from urllib.parse import urljoin

class TourAppAPITester:
    def __init__(self, base_url="https://quick-code-build.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.report_id = None

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = urljoin(self.api_url + "/", endpoint.lstrip("/"))
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
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
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        success, response = self.run_test("Seed Data", "POST", "seed", 200)
        return success

    def test_get_drivers(self):
        """Test getting drivers list"""
        success, response = self.run_test("Get Drivers", "GET", "drivers", 200)
        return success, response

    def test_get_plads(self):
        """Test getting plads list"""
        success, response = self.run_test("Get Plads", "GET", "plads", 200)
        return success, response

    def test_create_report(self):
        """Test creating a new report"""
        report_data = {
            "report_date": datetime.now().strftime("%Y-%m-%d"),
            "start_time": "07:00"
        }
        success, response = self.run_test("Create Report", "POST", "reports", 201, report_data)
        if success and 'id' in response:
            self.report_id = response['id']
            print(f"   Created report ID: {self.report_id}")
        return success

    def test_parse_mail(self):
        """Test mail parsing functionality"""
        if not self.report_id:
            print("❌ No report ID available for mail parsing test")
            return False
            
        mail_data = {
            "text": "Test1\tTestFacility1\tTest Address 1, Glostrup\tContainer1\nTest2\tTestFacility2\tTest Address 2, Ballerup\tContainer2",
            "report_id": self.report_id
        }
        success, response = self.run_test("Parse Mail", "POST", "parse-mail", 200, mail_data)
        return success, response

    def test_get_tours(self):
        """Test getting tours for a report"""
        if not self.report_id:
            print("❌ No report ID available for tours test")
            return False, {}
            
        success, response = self.run_test("Get Tours", "GET", f"tours?report_id={self.report_id}", 200)
        return success, response

    def test_clear_all_tours(self):
        """Test clearing all tours for a report"""
        if not self.report_id:
            print("❌ No report ID available for clear tours test")
            return False
            
        success, response = self.run_test("Clear All Tours", "DELETE", f"tours/report/{self.report_id}", 200)
        return success

    def test_admin_login(self):
        """Test admin login functionality"""
        admin_data = {
            "username": "admin",
            "password": "ilkaps"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, admin_data)
        return success

    def test_get_weekly_schedule(self, week_start="2024-12-02"):
        """Test getting weekly schedule"""
        success, response = self.run_test("Get Weekly Schedule", "GET", f"schedule?week_start={week_start}", 200)
        return success, response

    def test_create_bulk_schedule(self, drivers):
        """Test creating bulk weekly schedule"""
        if not drivers:
            print("❌ No drivers available for schedule test")
            return False
            
        # Create sample schedule data for one week
        week_start = "2024-12-02"  # Monday
        schedules = []
        
        for i, driver in enumerate(drivers[:3]):  # Test with first 3 drivers
            for day_offset in range(7):  # 7 days
                date_obj = datetime.strptime(week_start, "%Y-%m-%d")
                from datetime import timedelta
                current_date = date_obj + timedelta(days=day_offset)
                date_str = current_date.strftime("%Y-%m-%d")
                
                # Assign different plads for variety
                if day_offset == 5 or day_offset == 6:  # Weekend
                    plads = "FRI"
                else:
                    plads_options = ["Glostrup", "Herlev", "Hillerød", "Ballerup"]
                    plads = plads_options[i % len(plads_options)]
                
                schedules.append({
                    "driver_id": driver["id"],
                    "driver_name": driver["name"], 
                    "date": date_str,
                    "plads": plads
                })
        
        bulk_data = {"schedules": schedules}
        success, response = self.run_test("Create Bulk Schedule", "POST", "schedule/bulk", 200, bulk_data)
        if success:
            print(f"   Created {len(schedules)} schedule entries")
        return success

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        success, response = self.run_test("Get Admin Stats", "GET", "admin/stats", 200)
        return success, response

    def test_get_messages(self):
        """Test getting messages"""
        success, response = self.run_test("Get Messages", "GET", "messages", 200)
        return success, response

def main():
    print("🚀 Starting Tour App API Testing...")
    tester = TourAppAPITester()

    # Test basic endpoints
    print("\n📡 Testing basic endpoints...")
    tester.test_seed_data()
    
    drivers_success, drivers = tester.test_get_drivers()
    if drivers_success:
        print(f"   Found {len(drivers)} drivers")
    
    plads_success, plads = tester.test_get_plads()
    if plads_success:
        print(f"   Found {len(plads)} plads")

    # Test admin functionality
    print("\n🔐 Testing admin functionality...")
    admin_login_success = tester.test_admin_login()
    
    admin_stats_success, stats = tester.test_admin_stats()
    if admin_stats_success:
        print(f"   Retrieved stats for {len(stats)} drivers")
    
    messages_success, messages = tester.test_get_messages()
    if messages_success:
        print(f"   Found {len(messages)} messages")

    # Test weekly schedule functionality
    print("\n📅 Testing weekly schedule functionality...")
    schedule_get_success, initial_schedule = tester.test_get_weekly_schedule()
    if schedule_get_success:
        print(f"   Initial schedule has {len(initial_schedule)} entries")
    
    # Test bulk schedule creation
    if drivers_success and drivers:
        bulk_schedule_success = tester.test_create_bulk_schedule(drivers)
        
        if bulk_schedule_success:
            # Verify schedule was created
            print("\n✅ Verifying schedule creation...")
            verify_success, new_schedule = tester.test_get_weekly_schedule()
            if verify_success:
                print(f"   Schedule now has {len(new_schedule)} entries")
                
                # Show some schedule details
                fri_count = len([s for s in new_schedule if s.get('plads') == 'FRI'])
                work_count = len([s for s in new_schedule if s.get('plads') != 'FRI'])
                print(f"   Schedule breakdown: {work_count} working days, {fri_count} free days")

    # Test report workflow
    print("\n📋 Testing report workflow...")
    if tester.test_create_report():
        
        # Test mail parsing
        print("\n📧 Testing mail parsing...")
        parse_success, parse_response = tester.test_parse_mail()
        if parse_success and 'tours' in parse_response:
            print(f"   Parsed {len(parse_response['tours'])} tours")
        
        # Test getting tours
        print("\n🚚 Testing tours retrieval...")
        tours_success, tours = tester.test_get_tours()
        if tours_success:
            print(f"   Retrieved {len(tours)} tours")
            
            # Show first few tours for debugging
            for i, tour in enumerate(tours[:3]):
                print(f"   Tour {i+1}: {tour.get('fraction', 'N/A')} - {tour.get('plads', 'N/A')}")
        
        # Test clearing tours
        print("\n🗑️ Testing clear all tours...")
        tester.test_clear_all_tours()
        
        # Verify tours are cleared
        print("\n✅ Verifying tours cleared...")
        tours_success, tours_after = tester.test_get_tours()
        if tours_success:
            print(f"   Tours remaining: {len(tours_after)}")

    # Print results summary
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    # Detailed failure analysis
    if tester.tests_passed < tester.tests_run:
        print("\n❌ Some tests failed. Common issues:")
        print("   1. Backend server might not be running")
        print("   2. Database connection issues")
        print("   3. API endpoint paths might have changed")
        print("   4. Missing required fields in requests")
        
        print("\n🔍 Weekly Schedule Feature Status:")
        if not admin_login_success:
            print("   - Admin login: FAILED")
        if not schedule_get_success:
            print("   - Get schedule: FAILED") 
        if drivers_success and not bulk_schedule_success:
            print("   - Bulk schedule creation: FAILED")
    else:
        print("\n✅ All tests passed! Weekly schedule feature is working correctly.")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())