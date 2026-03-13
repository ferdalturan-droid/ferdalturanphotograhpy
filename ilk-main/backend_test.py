#!/usr/bin/env python3
"""
Backend API Testing for Danish Driving Report Application
Tests all CRUD operations, mail parsing, and functionality
"""

import requests
import sys
import json
from datetime import datetime

class KorselsrapportAPITester:
    def __init__(self, base_url="https://code-simplify-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_report_id = None
        self.created_driver_ids = []
        self.created_tour_ids = []

    def log_test(self, name, success, details=""):
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} | {name}")
        if details:
            print(f"    📋 {details}")
        if success:
            self.tests_passed += 1
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request and validate response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            print(f"    💥 Request failed: {str(e)}")
            return False, None

    def test_root_endpoint(self):
        """Test basic API connectivity"""
        success, response = self.make_request('GET', '', expected_status=200)
        if success:
            data = response.json()
            details = f"API Version: {data.get('message', 'N/A')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("API Root Endpoint", success, details)

    def test_seed_data(self):
        """Test seeding default drivers"""
        success, response = self.make_request('POST', 'seed', expected_status=200)
        if success:
            data = response.json()
            details = f"Seeded {data.get('driver_count', 0)} drivers"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Seed Default Drivers", success, details)

    def test_get_drivers(self):
        """Test retrieving drivers list"""
        success, response = self.make_request('GET', 'drivers', expected_status=200)
        if success:
            drivers = response.json()
            # Check for expected default drivers
            driver_names = [d.get('name') for d in drivers]
            expected_names = ["Dennis", "Zekiye", "Emrer", "Ferdat", "FRI", "Rafael", 
                            "John", "Thomas", "Tony", "Murat", "Nihat", "Berrin"]
            found_names = [name for name in expected_names if name in driver_names]
            details = f"Found {len(drivers)} drivers, {len(found_names)}/{len(expected_names)} default drivers present"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Get Drivers List", success, details)

    def test_create_driver(self):
        """Test creating a new driver"""
        driver_data = {
            "name": "Test Chauffør",
            "plate": "TEST123", 
            "area": "Test Area",
            "facility": "ARGO"
        }
        
        success, response = self.make_request('POST', 'drivers', data=driver_data, expected_status=200)
        if success:
            driver = response.json()
            self.created_driver_ids.append(driver.get('id'))
            details = f"Created driver: {driver.get('name')} - {driver.get('plate')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Create New Driver", success, details)

    def test_create_report(self):
        """Test creating a new report"""
        report_data = {
            "driver_name": "Test Chauffør",
            "vehicle_reg": "TEST123",
            "start_time": "07:00",
            "end_time": "15:00", 
            "report_date": datetime.now().strftime("%Y-%m-%d"),
            "plads": "Glostrup",
            "notes": "Test report notes"
        }
        
        success, response = self.make_request('POST', 'reports', data=report_data, expected_status=200)
        if success:
            report = response.json()
            self.test_report_id = report.get('id')
            details = f"Report ID: {self.test_report_id}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Create New Report", success, details)

    def test_parse_mail(self):
        """Test mail parsing functionality with sample Danish tour data"""
        sample_mail = """15/03/2024
CONT123
Beton
Transport A/S
Solum
Selinevej 4, 2300 København S

16/03/2024
CONT456
Pap
Transport B/S
Damifo
Rødovre Parkvej 10, 2610 Rødovre"""

        mail_data = {
            "text": sample_mail,
            "report_id": self.test_report_id or ""
        }
        
        success, response = self.make_request('POST', 'parse-mail', data=mail_data, expected_status=200)
        if success:
            result = response.json()
            details = f"Parsed {result.get('count', 0)} tours, Success: {result.get('success', False)}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Parse Mail Content", success, details)

    def test_create_tour(self):
        """Test creating a manual tour"""
        tour_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "fraction": "Test Fraktion",
            "facility": "Test Facility",
            "address": "Test Address, 1234 Test By",
            "container": "TESTCONT001",
            "is_same_day": False,
            "report_id": self.test_report_id or ""
        }
        
        success, response = self.make_request('POST', 'tours', data=tour_data, expected_status=200)
        if success:
            tour = response.json()
            self.created_tour_ids.append(tour.get('id'))
            details = f"Created tour: {tour.get('fraction')} -> {tour.get('facility')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Create Manual Tour", success, details)

    def test_create_pause(self):
        """Test creating a pause entry"""
        report_param = f"?report_id={self.test_report_id}" if self.test_report_id else ""
        success, response = self.make_request('POST', f'tours/pause{report_param}', expected_status=200)
        if success:
            pause = response.json()
            self.created_tour_ids.append(pause.get('id'))
            details = f"Created pause entry with ID: {pause.get('id')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Create Pause Entry", success, details)

    def test_get_tours(self):
        """Test retrieving tours"""
        report_param = f"?report_id={self.test_report_id}" if self.test_report_id else ""
        success, response = self.make_request('GET', f'tours{report_param}', expected_status=200)
        if success:
            tours = response.json()
            details = f"Found {len(tours)} tours"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Get Tours List", success, details)

    def test_update_tour(self):
        """Test updating tour weight and time"""
        if not self.created_tour_ids:
            return self.log_test("Update Tour Weight/Time", False, "No tour ID available")
        
        tour_id = self.created_tour_ids[0]
        update_data = {
            "weight": 1500.5,
            "time": "14:30",
            "on_way": True,
            "completed": False
        }
        
        success, response = self.make_request('PUT', f'tours/{tour_id}', data=update_data, expected_status=200)
        if success:
            tour = response.json()
            details = f"Updated weight: {tour.get('weight')}kg, time: {tour.get('time')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Update Tour Weight/Time", success, details)

    def test_toggle_tour_status(self):
        """Test toggling tour completion status"""
        if not self.created_tour_ids:
            return self.log_test("Toggle Tour Completion", False, "No tour ID available")
        
        tour_id = self.created_tour_ids[0]
        update_data = {
            "completed": True,
            "on_way": False
        }
        
        success, response = self.make_request('PUT', f'tours/{tour_id}', data=update_data, expected_status=200)
        if success:
            tour = response.json()
            details = f"Marked as completed: {tour.get('completed')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Toggle Tour Completion", success, details)

    def test_bulk_create_tours(self):
        """Test bulk tour creation"""
        tours_data = [
            {
                "date": "16/03/2024",
                "fraction": "Bulk Test 1",
                "facility": "Bulk Facility 1", 
                "address": "Bulk Address 1",
                "container": "BULK001",
                "report_id": self.test_report_id or ""
            },
            {
                "date": "16/03/2024",
                "fraction": "Bulk Test 2",
                "facility": "Bulk Facility 2",
                "address": "Bulk Address 2", 
                "container": "BULK002",
                "report_id": self.test_report_id or ""
            }
        ]
        
        success, response = self.make_request('POST', 'tours/bulk', data=tours_data, expected_status=200)
        if success:
            tours = response.json()
            for tour in tours:
                self.created_tour_ids.append(tour.get('id'))
            details = f"Created {len(tours)} tours in bulk"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        return self.log_test("Bulk Create Tours", success, details)

    def cleanup_test_data(self):
        """Clean up created test data"""
        cleanup_success = 0
        cleanup_total = 0
        
        # Delete created tours
        for tour_id in self.created_tour_ids:
            cleanup_total += 1
            success, _ = self.make_request('DELETE', f'tours/{tour_id}', expected_status=200)
            if success:
                cleanup_success += 1
        
        # Delete created drivers
        for driver_id in self.created_driver_ids:
            cleanup_total += 1
            success, _ = self.make_request('DELETE', f'drivers/{driver_id}', expected_status=200)
            if success:
                cleanup_success += 1
        
        # Delete test report
        if self.test_report_id:
            cleanup_total += 1
            success, _ = self.make_request('DELETE', f'reports/{self.test_report_id}', expected_status=200)
            if success:
                cleanup_success += 1
        
        return self.log_test(f"Cleanup Test Data", cleanup_success == cleanup_total, 
                           f"Cleaned {cleanup_success}/{cleanup_total} items")

    def run_all_tests(self):
        """Execute all backend API tests"""
        print("🚛 Starting Kørselsrapport Backend API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            self.test_root_endpoint,
            self.test_seed_data,
            self.test_get_drivers,
            self.test_create_driver,
            self.test_create_report,
            self.test_parse_mail,
            self.test_create_tour,
            self.test_create_pause,
            self.test_get_tours,
            self.test_update_tour,
            self.test_toggle_tour_status,
            self.test_bulk_create_tours,
            self.cleanup_test_data
        ]
        
        for test in tests:
            test()
        
        # Final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend API tests completed successfully!")
            return 0
        else:
            print("⚠️  Some backend API tests failed!")
            return 1

def main():
    tester = KorselsrapportAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())