import requests
import sys
import json
import time
from datetime import datetime

class MultiAgentResearchTester:
    def __init__(self):
        self.base_url = "https://research-automation.preview.emergentagent.com/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=10):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            print(f"Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        if success:
            print(f"Response: {response}")
        return success

    def test_status_endpoint_post(self):
        """Test status check creation"""
        success, response = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": "test_client"}
        )
        return success

    def test_status_endpoint_get(self):
        """Test status check retrieval"""
        success, response = self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )
        return success

    def test_research_start(self):
        """Test starting a research session"""
        success, response = self.run_test(
            "Start Research Session",
            "POST",
            "research/start",
            200,
            data={"topic": "Test research topic for API testing"},
            timeout=30
        )
        
        if success and isinstance(response, dict) and 'session_id' in response:
            self.session_id = response['session_id']
            print(f"Session ID: {self.session_id}")
        
        return success

    def test_research_stream(self):
        """Test SSE stream endpoint availability"""
        if not self.session_id:
            print("❌ No session ID available for stream test")
            return False
            
        success, _ = self.run_test(
            "Research Stream Endpoint",
            "GET", 
            f"research/stream/{self.session_id}",
            200,
            timeout=5
        )
        return success

    def test_get_research_session(self):
        """Test getting research session by ID"""
        if not self.session_id:
            print("❌ No session ID available for session test")
            return False
            
        # Wait a moment for session to be created
        time.sleep(2)
        
        success, response = self.run_test(
            "Get Research Session",
            "GET",
            f"research/{self.session_id}",
            200
        )
        
        if success:
            print(f"Session data: {response}")
        
        return success

    def test_get_all_research_sessions(self):
        """Test getting all research sessions"""
        success, response = self.run_test(
            "Get All Research Sessions",
            "GET",
            "research",
            200
        )
        
        if success:
            print(f"Found {len(response) if isinstance(response, list) else 0} sessions")
        
        return success

    def test_export_markdown(self):
        """Test export session as Markdown"""
        if not self.session_id:
            print("❌ No session ID available for export test")
            return False
            
        success, response = self.run_test(
            "Export Session as Markdown",
            "GET",
            f"research/{self.session_id}/export/markdown",
            200
        )
        
        if success:
            print(f"Markdown export successful, content length: {len(str(response))}")
        
        return success

    def test_export_json(self):
        """Test export session as JSON"""
        if not self.session_id:
            print("❌ No session ID available for export test")
            return False
            
        success, response = self.run_test(
            "Export Session as JSON",
            "GET",
            f"research/{self.session_id}/export/json",
            200
        )
        
        if success:
            print(f"JSON export successful, content length: {len(str(response))}")
        
        return success

    def test_delete_session(self):
        """Test delete session functionality"""
        if not self.session_id:
            print("❌ No session ID available for delete test")
            return False
            
        # First, create a new session for deletion to avoid affecting other tests
        success, response = self.run_test(
            "Create Session for Deletion Test",
            "POST",
            "research/start",
            200,
            data={"topic": "Test session to be deleted"},
            timeout=30
        )
        
        if not success:
            return False
            
        delete_session_id = response.get('session_id')
        if not delete_session_id:
            print("❌ Failed to get session ID for deletion")
            return False
            
        # Wait a bit for session to be created
        time.sleep(1)
        
        # Now delete the session
        url = f"{self.base_url}/research/{delete_session_id}"
        try:
            response = requests.delete(url)
            success = response.status_code == 200
            
            self.tests_run += 1
            if success:
                self.tests_passed += 1
                print(f"✅ Delete Session Passed - Status: {response.status_code}")
                print(f"Response: {response.text}")
            else:
                print(f"❌ Delete Session Failed - Expected 200, got {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"❌ Delete Session Failed - Error: {str(e)}")
            success = False
            
        return success

def main():
    print("🚀 Testing Multi-Agent Research System Backend APIs")
    print("=" * 60)
    
    tester = MultiAgentResearchTester()
    
    # Test all endpoints
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Status POST", tester.test_status_endpoint_post),
        ("Status GET", tester.test_status_endpoint_get),
        ("Research Start", tester.test_research_start),
        ("Research Stream", tester.test_research_stream),
        ("Get Research Session", tester.test_get_research_session),
        ("Get All Sessions", tester.test_get_all_research_sessions),
        ("Export Markdown", tester.test_export_markdown),
        ("Export JSON", tester.test_export_json),
        ("Delete Session", tester.test_delete_session),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Tests Results: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())